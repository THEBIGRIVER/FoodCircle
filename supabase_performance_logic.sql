-- Performance and Rating Management for FoodCircle

-- 1. Meal Ratings Table (as requested)
CREATE TABLE meal_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chef_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  cook_date DATE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(meal_id, user_id)
);

ALTER TABLE meal_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ratings in their circle" ON meal_ratings FOR SELECT
USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_id = meal_ratings.circle_id AND profile_id = auth.uid()));

CREATE POLICY "Users can rate meals they received" ON meal_ratings FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = meal_ratings.circle_id AND profile_id = auth.uid()) AND
    chef_id != auth.uid()
);

-- 2. Function to calculate average rating for a chef in the current cycle
CREATE OR REPLACE FUNCTION get_chef_cycle_average(p_chef_id UUID, p_circle_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_rating DECIMAL;
    cycle_start DATE;
BEGIN
    -- Get the start date of the current cycle for this circle
    SELECT cycle_start_date INTO cycle_start FROM circles WHERE id = p_circle_id;

    SELECT AVG(rating)::DECIMAL INTO avg_rating
    FROM meal_ratings
    WHERE chef_id = p_chef_id 
      AND circle_id = p_circle_id
      AND cook_date >= cycle_start;

    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to monitor performance after a rating is submitted
-- This is a bit complex because we usually check at the END of a cycle.
-- But the requirement says "If a member's average rating falls below 2... send a warning flag".
-- We'll check after each rating if the cycle is "complete" for that chef or just check periodically.
-- Let's assume we check when the chef's turn in the cycle is over.

CREATE OR REPLACE FUNCTION process_chef_performance()
RETURNS TRIGGER AS $$
DECLARE
    avg_perf DECIMAL;
    current_consecutive INTEGER;
BEGIN
    -- Calculate current cycle average
    avg_perf := get_chef_cycle_average(NEW.chef_id, NEW.circle_id);

    -- If performance is low
    IF avg_perf < 2 AND avg_perf > 0 THEN
        -- Flag the member
        UPDATE circle_members 
        SET is_flagged = TRUE 
        WHERE profile_id = NEW.chef_id AND circle_id = NEW.circle_id;
    ELSE
        UPDATE circle_members 
        SET is_flagged = FALSE 
        WHERE profile_id = NEW.chef_id AND circle_id = NEW.circle_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_submitted
AFTER INSERT ON meal_ratings
FOR EACH ROW
EXECUTE FUNCTION process_chef_performance();

-- 4. Function to handle cycle completion and removal rule
-- This should be called when a cycle ends.
CREATE OR REPLACE FUNCTION finalize_cycle_performance(p_circle_id UUID)
RETURNS VOID AS $$
DECLARE
    member_record RECORD;
    avg_perf DECIMAL;
BEGIN
    FOR member_record IN SELECT profile_id FROM circle_members WHERE circle_id = p_circle_id LOOP
        avg_perf := get_chef_cycle_average(member_record.profile_id, p_circle_id);
        
        IF avg_perf < 2 AND avg_perf > 0 THEN
            -- Increment consecutive low ratings
            UPDATE circle_members 
            SET consecutive_low_ratings = consecutive_low_ratings + 1
            WHERE profile_id = member_record.profile_id AND circle_id = p_circle_id;
            
            -- Check removal rule
            IF EXISTS (SELECT 1 FROM circle_members WHERE profile_id = member_record.profile_id AND circle_id = p_circle_id AND consecutive_low_ratings >= 2) THEN
                DELETE FROM circle_members WHERE profile_id = member_record.profile_id AND circle_id = p_circle_id;
            END IF;
        ELSE
            -- Reset consecutive low ratings if they improved
            UPDATE circle_members 
            SET consecutive_low_ratings = 0
            WHERE profile_id = member_record.profile_id AND circle_id = p_circle_id;
        END IF;
    END LOOP;
    
    -- Update cycle start date for the next cycle
    UPDATE circles SET cycle_start_date = CURRENT_DATE WHERE id = p_circle_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Cooking Failure Rule
CREATE OR REPLACE FUNCTION handle_missed_meal(p_meal_id UUID)
RETURNS VOID AS $$
DECLARE
    v_circle_id UUID;
    v_chef_id UUID;
    v_meal_date DATE;
    v_next_chef_id UUID;
    v_next_member_index INTEGER;
    v_circle_size INTEGER;
BEGIN
    -- Get missed meal details
    SELECT circle_id, chef_id, meal_date INTO v_circle_id, v_chef_id, v_meal_date
    FROM meals WHERE id = p_meal_id;

    -- 1. Mark status as missed
    UPDATE meals SET status = 'missed' WHERE id = p_meal_id;

    -- 2. Mark penalty for the failed member
    UPDATE circle_members SET penalty_days = 2 WHERE profile_id = v_chef_id AND circle_id = v_circle_id;

    -- 3. Find the next member in rotation
    SELECT size INTO v_circle_size FROM circles WHERE id = v_circle_id;
    
    SELECT member_index INTO v_next_member_index 
    FROM circle_members 
    WHERE profile_id = v_chef_id AND circle_id = v_circle_id;
    
    v_next_member_index := (v_next_member_index + 1) % v_circle_size;

    SELECT profile_id INTO v_next_chef_id 
    FROM circle_members 
    WHERE circle_id = v_circle_id AND member_index = v_next_member_index;

    -- 4. Assign the next member to take the turn (reschedule today's meal or create a new one)
    -- In a real app, we might shift the whole schedule. For simplicity, we'll just update the next meal.
    -- Or create a new meal for the next chef today.
    INSERT INTO meals (circle_id, chef_id, meal_date, status)
    VALUES (v_circle_id, v_next_chef_id, v_meal_date, 'pending');
END;
$$ LANGUAGE plpgsql;

-- RPC Helpers for Frontend
CREATE OR REPLACE FUNCTION submit_meal_rating(
    p_meal_id UUID,
    p_rating INTEGER,
    p_comment TEXT
) RETURNS VOID AS $$
DECLARE
    v_meal RECORD;
BEGIN
    SELECT * INTO v_meal FROM meals WHERE id = p_meal_id;
    
    INSERT INTO meal_ratings (user_id, chef_id, circle_id, meal_id, cook_date, rating, comment)
    VALUES (auth.uid(), v_meal.chef_id, v_meal.circle_id, p_meal_id, v_meal.meal_date, p_rating, p_comment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Meal Skip Logic
CREATE OR REPLACE FUNCTION toggle_meal_skip(p_meal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM meal_skips 
        WHERE meal_id = p_meal_id AND profile_id = auth.uid()
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM meal_skips 
        WHERE meal_id = p_meal_id AND profile_id = auth.uid();
        RETURN FALSE; -- Not skipped anymore
    ELSE
        INSERT INTO meal_skips (meal_id, profile_id)
        VALUES (p_meal_id, auth.uid());
        RETURN TRUE; -- Now skipped
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_meal_portion_count(p_meal_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_members INTEGER;
    v_skip_count INTEGER;
BEGIN
    -- Get total members in the circle for this meal
    SELECT c.size INTO v_total_members
    FROM meals m
    JOIN circles c ON m.circle_id = c.id
    WHERE m.id = p_meal_id;

    -- Count skips
    SELECT COUNT(*) INTO v_skip_count
    FROM meal_skips
    WHERE meal_id = p_meal_id;

    RETURN v_total_members - v_skip_count;
END;
$$ LANGUAGE plpgsql STABLE;

