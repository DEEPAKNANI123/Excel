
-- =============================================
-- CPM PORTAL: MASTER PRODUCTION SCHEMA (2026)
-- Optimized for: PostgreSQL Cloud (Amazon RDS / Supabase)
-- =============================================

-- 1. PROFILES (The HR/SAP Data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    auth_email TEXT UNIQUE,
    password_hash TEXT, -- SECURE BCRYPT HASH
    role TEXT DEFAULT 'employee', -- 'employee', 'manager', 'hod', 'hr'
    manager_id TEXT, -- References employee_id of the manager
    department TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    "Display Name" TEXT
);

-- 2. STRATEGIC PILLARS (The Top-Level Themes)
CREATE TABLE IF NOT EXISTS global_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    department TEXT, -- Link theme to a specific department
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- 3. SUBTHEMES (Specific Execution Items)
CREATE TABLE IF NOT EXISTS global_subthemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID REFERENCES global_themes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT, -- Can contain [Start - End | Review] strings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALIGNMENTS (Employee submissions)
CREATE TABLE IF NOT EXISTS employee_subtheme_alignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    subtheme_id UUID REFERENCES global_subthemes(id) ON DELETE CASCADE,
    cycle_year TEXT, -- e.g. '2026'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'RETURNED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    manager_feedback TEXT
);

-- 5. MONTHLY REVIEWS (Performance Outcomes)
CREATE TABLE IF NOT EXISTS monthly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    cycle_id TEXT NOT NULL, -- e.g. 'MAY_2026'
    overall_result TEXT DEFAULT 'PENDING', -- 'YES', 'NO', 'PENDING'
    theme_results JSONB DEFAULT '{}', -- Stores binary results for each subtheme
    attachments JSONB DEFAULT '[]', -- Stores file links
    manager_comment TEXT,
    submitted_at TIMESTAMPTZ,
    UNIQUE(employee_id, cycle_id)
);
