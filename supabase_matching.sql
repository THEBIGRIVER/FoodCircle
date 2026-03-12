-- Automatic Group Matching Logic for FoodCircle

-- 1. Function to attempt matching a user into a circle
CREATE OR REPLACE FUNCTION attempt_match(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    u_pincode TEXT;
    u_food_type TEXT;
    u_group_size INTEGER;
    u_family_size INTEGER;
    matched_user_ids UUID[];
    new_circle_id UUID;
    i INTEGER;
BEGIN
    -- Get user details
    SELECT pincode, food_type, group_size, family_size
    INTO u_pincode, u_food_type, u_group_size, u_family_size
    FROM profiles
    WHERE id = target_user_id;

    -- Check if user is already matched
    IF EXISTS (SELECT 1 FROM circle_members WHERE profile_id = target_user_id) THEN
        RETURN;
    END IF;

    -- Find potential matches (including the user themselves)
    -- We look for users with same pincode, food_type, group_size, and family_size
    -- who are NOT in any circle yet.
    SELECT ARRAY(
        SELECT id
        FROM profiles
        WHERE pincode = u_pincode
          AND food_type = u_food_type
          AND group_size = u_group_size
          AND family_size = u_family_size
          AND onboarded = TRUE
          AND id NOT IN (SELECT profile_id FROM circle_members)
        ORDER BY created_at ASC -- First come, first served
        LIMIT u_group_size
    ) INTO matched_user_ids;

    -- If we have exactly enough users to form a circle
    IF array_length(matched_user_ids, 1) = u_group_size THEN
        -- Create the circle
        INSERT INTO circles (pincode, preference, size, cycle_start_date)
        VALUES (u_pincode, u_food_type, u_group_size, CURRENT_DATE)
        RETURNING id INTO new_circle_id;

        -- Add members and generate schedule
        FOR i IN 1..u_group_size LOOP
            -- Add to circle_members
            INSERT INTO circle_members (circle_id, profile_id, member_index)
            VALUES (new_circle_id, matched_user_ids[i], i - 1);

            -- Generate cooking_schedule (meals)
            -- Each member gets one cooking day in rotation starting from today
            INSERT INTO meals (circle_id, chef_id, meal_date, status)
            VALUES (new_circle_id, matched_user_ids[i], CURRENT_DATE + (i - 1), 'pending');
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to run matching when a profile is updated to 'onboarded = true'
CREATE OR REPLACE FUNCTION trigger_attempt_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if onboarded status changes to TRUE
    IF NEW.onboarded = TRUE AND (OLD.onboarded = FALSE OR OLD.onboarded IS NULL) THEN
        PERFORM attempt_match(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on redeploy
DROP TRIGGER IF EXISTS on_profile_onboarded ON profiles;

CREATE TRIGGER on_profile_onboarded
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_attempt_match();
