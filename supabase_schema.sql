-- Supabase Database Schema for FoodCircle

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  pincode TEXT,
  family_members INTEGER DEFAULT 1,
  preference TEXT CHECK (preference IN ('Vegetarian', 'Non-vegetarian', 'Vegan')),
  target_group_size INTEGER CHECK (target_group_size IN (7, 14, 21, 28, 35)),
  average_rating DECIMAL(3,2) DEFAULT 5.0,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Circles (Groups) Table
CREATE TABLE circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pincode TEXT NOT NULL,
  preference TEXT NOT NULL,
  size INTEGER NOT NULL,
  current_chef_index INTEGER DEFAULT 0,
  cycle_start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Circle Members (Junction Table)
CREATE TABLE circle_members (
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  member_index INTEGER NOT NULL, -- Position in the cooking rotation
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (circle_id, profile_id)
);

-- 4. Meals (Cooking Schedule)
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  chef_id UUID REFERENCES profiles(id),
  meal_date DATE NOT NULL,
  menu TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'picked-up', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Ratings Table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES profiles(id),
  taste INTEGER CHECK (taste BETWEEN 1 AND 5),
  hygiene INTEGER CHECK (hygiene BETWEEN 1 AND 5),
  portion INTEGER CHECK (portion BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(meal_id, rater_id) -- One rating per meal per user
);

-- 6. Subscriptions Table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  amount INTEGER NOT NULL,
  billing_cycle_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- --- Row Level Security (RLS) ---

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all (for matching/leaderboard) but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Circles: Members can see their own circle
CREATE POLICY "Members can view their circle" ON circles FOR SELECT 
USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_id = circles.id AND profile_id = auth.uid()));

-- Meals: Members of the circle can view and rate
CREATE POLICY "Circle members can view meals" ON meals FOR SELECT 
USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_id = meals.circle_id AND profile_id = auth.uid()));

CREATE POLICY "Chefs can update their own meal menu" ON meals FOR UPDATE
USING (chef_id = auth.uid());

-- Ratings: Users can see ratings in their circle, but only create for meals they received
CREATE POLICY "Users can view ratings in their circle" ON ratings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM meals m 
  JOIN circle_members cm ON m.circle_id = cm.circle_id 
  WHERE m.id = ratings.meal_id AND cm.profile_id = auth.uid()
));

CREATE POLICY "Users can rate meals in their circle" ON ratings FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM meals m 
  JOIN circle_members cm ON m.circle_id = cm.circle_id 
  WHERE m.id = meal_id AND cm.profile_id = auth.uid() AND m.chef_id != auth.uid()
));
