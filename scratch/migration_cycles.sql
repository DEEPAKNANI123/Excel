-- CPM Tool: Strict Relational Cycle Migration Script
-- Run this in your Supabase SQL Editor

-- 1. Create the Master Cycles Table
CREATE TABLE IF NOT EXISTS master_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_name TEXT NOT NULL UNIQUE, -- e.g., 'FY 2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert a default active cycle if none exists
INSERT INTO master_cycles (cycle_name, start_date, end_date, is_active)
VALUES ('FY 2026', '2026-01-01', '2026-12-31', true)
ON CONFLICT (cycle_name) DO NOTHING;

-- 3. Modify global_themes table
-- We add a new UUID column, link it, and drop the old text column
ALTER TABLE global_themes ADD COLUMN new_cycle_id UUID REFERENCES master_cycles(id) ON DELETE CASCADE;
-- Attempt to map existing data (assuming '2026' maps to 'FY 2026')
UPDATE global_themes SET new_cycle_id = (SELECT id FROM master_cycles WHERE is_active = true LIMIT 1);
ALTER TABLE global_themes DROP COLUMN cycle_id;
ALTER TABLE global_themes RENAME COLUMN new_cycle_id TO cycle_id;

-- 4. Modify monthly_reviews table
-- Monthly reviews now need a specific month column alongside the cycle UUID
ALTER TABLE monthly_reviews ADD COLUMN review_month TEXT; -- e.g., 'MAY'
ALTER TABLE monthly_reviews ADD COLUMN new_cycle_id UUID REFERENCES master_cycles(id) ON DELETE CASCADE;
-- Map existing data
UPDATE monthly_reviews SET new_cycle_id = (SELECT id FROM master_cycles WHERE is_active = true LIMIT 1);

-- Extract the month robustly
-- If the old cycle_id was a UUID, extract the month from the submitted_at date
UPDATE monthly_reviews 
SET review_month = UPPER(to_char(submitted_at::TIMESTAMPTZ, 'MON')) 
WHERE cycle_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' AND submitted_at IS NOT NULL;

-- If it was already formatted as MAY_2026, extract it directly
UPDATE monthly_reviews 
SET review_month = split_part(cycle_id, '_', 1)
WHERE cycle_id != 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Clean up duplicates: Keep only the most recent submission per employee per month
DELETE FROM monthly_reviews
WHERE id NOT IN (
    SELECT DISTINCT ON (employee_id, review_month, new_cycle_id) id
    FROM monthly_reviews
    ORDER BY employee_id, review_month, new_cycle_id, submitted_at DESC
);

ALTER TABLE monthly_reviews DROP COLUMN cycle_id;
ALTER TABLE monthly_reviews RENAME COLUMN new_cycle_id TO cycle_id;

-- Create the new strict unique constraint for monthly reviews
-- An employee can only submit ONE review per month per cycle!
ALTER TABLE monthly_reviews DROP CONSTRAINT IF EXISTS monthly_reviews_employee_id_cycle_id_key;
ALTER TABLE monthly_reviews ADD CONSTRAINT unique_employee_month_cycle UNIQUE(employee_id, review_month, cycle_id);

-- 5. Modify employee_subtheme_alignment
-- It currently uses 'cycle_year INTEGER'. We will migrate this to use the master cycle UUID.
ALTER TABLE employee_subtheme_alignment ADD COLUMN new_cycle_id UUID REFERENCES master_cycles(id) ON DELETE CASCADE;
UPDATE employee_subtheme_alignment SET new_cycle_id = (SELECT id FROM master_cycles WHERE is_active = true LIMIT 1);
ALTER TABLE employee_subtheme_alignment DROP CONSTRAINT IF EXISTS employee_subtheme_alignment_employee_id_subtheme_id_cycle_y_key;
ALTER TABLE employee_subtheme_alignment DROP COLUMN cycle_year;
ALTER TABLE employee_subtheme_alignment RENAME COLUMN new_cycle_id TO cycle_id;
ALTER TABLE employee_subtheme_alignment ADD CONSTRAINT unique_alignment UNIQUE(employee_id, subtheme_id, cycle_id);
