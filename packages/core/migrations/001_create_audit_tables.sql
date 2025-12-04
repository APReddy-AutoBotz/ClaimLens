-- ClaimLens Audit Storage Schema
-- TimescaleDB migration for audit records

-- Create audit_records table
CREATE TABLE IF NOT EXISTS audit_records (
    audit_id TEXT PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    tenant TEXT NOT NULL,
    profile TEXT NOT NULL,
    route TEXT NOT NULL,
    item_id TEXT NOT NULL,
    transforms JSONB NOT NULL,
    verdict JSONB NOT NULL,
    latency_ms NUMERIC NOT NULL,
    degraded_mode BOOLEAN NOT NULL DEFAULT false,
    degraded_services TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
-- Partitioned by month
SELECT create_hypertable(
    'audit_records',
    'ts',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 month'
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_records_tenant_ts 
    ON audit_records (tenant, ts DESC);

CREATE INDEX IF NOT EXISTS idx_audit_records_correlation 
    ON audit_records ((verdict->>'correlation_id'));

CREATE INDEX IF NOT EXISTS idx_audit_records_item 
    ON audit_records (item_id);

CREATE INDEX IF NOT EXISTS idx_audit_records_tenant_item 
    ON audit_records (tenant, item_id, ts DESC);

-- Create index for degraded mode queries
CREATE INDEX IF NOT EXISTS idx_audit_records_degraded 
    ON audit_records (degraded_mode, ts DESC) 
    WHERE degraded_mode = true;

-- Add retention policy (default 90 days, configurable per tenant)
-- This will automatically drop partitions older than retention period
SELECT add_retention_policy(
    'audit_records',
    INTERVAL '90 days',
    if_not_exists => TRUE
);

-- Create tenant configuration table
CREATE TABLE IF NOT EXISTS tenant_config (
    tenant TEXT PRIMARY KEY,
    retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days >= 90 AND retention_days <= 365),
    webhook_url TEXT,
    webhook_secret TEXT,
    allowed_locales TEXT[] NOT NULL DEFAULT ARRAY['en-IN'],
    custom_rule_packs TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    tenant TEXT NOT NULL REFERENCES tenant_config(tenant) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant 
    ON api_keys (tenant);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
    ON api_keys (key_hash);

-- Create policy change log table
CREATE TABLE IF NOT EXISTS policy_change_log (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    before_value JSONB,
    after_value JSONB,
    diff TEXT,
    context TEXT,
    constraints TEXT,
    self_critique TEXT,
    version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_policy_change_log_tenant_ts 
    ON policy_change_log (tenant, ts DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tenant_config
CREATE TRIGGER update_tenant_config_updated_at 
    BEFORE UPDATE ON tenant_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

