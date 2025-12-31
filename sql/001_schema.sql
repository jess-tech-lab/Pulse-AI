-- Pulse AI - Database Schema with Row-Level Security for Multi-Tenancy
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tenants table (companies using Pulse AI)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles linked to auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies being monitored (tracked by tenants)
CREATE TABLE IF NOT EXISTS monitored_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    search_terms TEXT[] DEFAULT '{}', -- Additional search terms
    subreddits TEXT[] DEFAULT '{}',   -- Specific subreddits to monitor
    twitter_handles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback items collected from various sources
CREATE TABLE IF NOT EXISTS feedback_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,

    -- Source information
    source VARCHAR(50) NOT NULL, -- reddit, twitter, google_reviews, web
    source_id VARCHAR(255),      -- Original ID from source
    source_url TEXT,

    -- Content
    title TEXT,
    body TEXT NOT NULL,
    author VARCHAR(255),

    -- Source-specific metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    original_created_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),

    -- Classification results
    category VARCHAR(50),        -- Bugs, Feature Requests, Usability Friction, Support Questions, Rants
    user_segment VARCHAR(50),    -- Free, Paid, Enterprise
    impact_type VARCHAR(50),     -- Revenue, Retention, Brand Trust
    urgency VARCHAR(100),        -- Blocks workflow, Affects many users
    sentiment VARCHAR(20),       -- Positive, Negative, Neutral, Mixed
    confidence_score DECIMAL(3,2), -- Classification confidence 0.00-1.00

    -- Analysis
    summary TEXT,
    key_points TEXT[],

    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate entries
    UNIQUE(tenant_id, source, source_id)
);

-- Aggregate insights generated from feedback
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50),

    -- Impact metrics
    feedback_count INTEGER DEFAULT 0,
    affected_users_estimate VARCHAR(100),
    urgency_level VARCHAR(20), -- Critical, High, Medium, Low

    -- Related feedback items
    feedback_item_ids UUID[] DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'new', -- new, acknowledged, in_progress, resolved, wont_fix
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape jobs for tracking pipeline runs
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,

    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed

    items_found INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,

    error_message TEXT,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitored_companies_tenant ON monitored_companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_tenant ON feedback_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_company ON feedback_items(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_category ON feedback_items(category);
CREATE INDEX IF NOT EXISTS idx_feedback_items_source ON feedback_items(source);
CREATE INDEX IF NOT EXISTS idx_feedback_items_scraped_at ON feedback_items(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_tenant ON insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_tenant ON scrape_jobs(tenant_id);

-- ============================================================================
-- HELPER FUNCTION: Get current user's tenant_id
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id
        FROM user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Tenants: Users can only see their own tenant
CREATE POLICY "Users see own tenant" ON tenants
    FOR ALL USING (id = get_user_tenant_id());

-- User Profiles: Users can only see profiles in their tenant
CREATE POLICY "Users see own tenant profiles" ON user_profiles
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Monitored Companies: Users can only access companies in their tenant
CREATE POLICY "Users access own tenant companies" ON monitored_companies
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Feedback Items: Users can only see feedback for their tenant
CREATE POLICY "Users see own tenant feedback" ON feedback_items
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Insights: Users can only see insights for their tenant
CREATE POLICY "Users see own tenant insights" ON insights
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Scrape Jobs: Users can only see jobs for their tenant
CREATE POLICY "Users see own tenant jobs" ON scrape_jobs
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- SERVICE ROLE BYPASS (for backend operations)
-- These policies allow the service role to access all data for background jobs
-- ============================================================================

-- Feedback Items: Service role can insert/update all
CREATE POLICY "Service role full access feedback" ON feedback_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access companies" ON monitored_companies
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access jobs" ON scrape_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access insights" ON insights
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitored_companies_updated_at BEFORE UPDATE ON monitored_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_items_updated_at BEFORE UPDATE ON feedback_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
