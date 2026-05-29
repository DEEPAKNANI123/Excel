-- CPM Tool Upgrade Migration Script
-- Run this in your Supabase SQL Editor

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employee', 'manager', 'hod', 'hr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('PERMANENT', 'PROBATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_rating AS ENUM ('YES', 'NO', 'NEUTRAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type employment_type DEFAULT 'PERMANENT';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS function TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_function TEXT;

-- 3. Create New Theme System
CREATE TABLE IF NOT EXISTS global_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS global_subthemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES global_themes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Employee Subtheme Alignment
CREATE TABLE IF NOT EXISTS employee_subtheme_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subtheme_id UUID REFERENCES global_subthemes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id), 
  status submission_status DEFAULT 'PENDING',
  cycle_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, subtheme_id, cycle_year)
);

-- 5. Update monthly_reviews for the new rating system
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS rating review_rating;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS rating_status submission_status DEFAULT 'PENDING';

-- 6. Add Hierarchy Helper Function
CREATE OR REPLACE FUNCTION get_reports_hierarchy(manager_uuid UUID)
RETURNS TABLE (profile_id UUID, level INT) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reports AS (
    SELECT id, 1 as level FROM profiles WHERE manager_id = manager_uuid
    UNION ALL
    SELECT p.id, r.level + 1 FROM profiles p
    JOIN reports r ON p.manager_id = r.id
  )
  SELECT * FROM reports;
END;
$$ LANGUAGE plpgsql;
