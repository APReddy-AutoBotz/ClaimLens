-- ClaimLens Multi-Tenancy and RBAC Schema
-- Migration for tenant, user, and role-based access control

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_tenant 
    ON users (tenant_id);

CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users (email);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user 
    ON sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token 
    ON sessions (token_hash);

CREATE INDEX IF NOT EXISTS idx_sessions_expires 
    ON sessions (expires_at);

-- Update tenant_config to reference tenants table
ALTER TABLE tenant_config 
    ADD CONSTRAINT fk_tenant_config_tenant 
    FOREIGN KEY (tenant) REFERENCES tenants(id) ON DELETE CASCADE;

-- Update api_keys to reference tenants table
ALTER TABLE api_keys 
    DROP CONSTRAINT IF EXISTS api_keys_tenant_fkey;

ALTER TABLE api_keys 
    ADD CONSTRAINT fk_api_keys_tenant 
    FOREIGN KEY (tenant) REFERENCES tenants(id) ON DELETE CASCADE;

-- Update policy_change_log to reference tenants and users
ALTER TABLE policy_change_log 
    ADD CONSTRAINT fk_policy_change_log_tenant 
    FOREIGN KEY (tenant) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE policy_change_log 
    ADD CONSTRAINT fk_policy_change_log_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add row-level security policies for tenant isolation
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tenant's data
CREATE POLICY tenant_isolation_audit_records ON audit_records
    FOR ALL
    USING (tenant = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_tenant_config ON tenant_config
    FOR ALL
    USING (tenant = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_api_keys ON api_keys
    FOR ALL
    USING (tenant = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy_change_log ON policy_change_log
    FOR ALL
    USING (tenant = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_sessions ON sessions
    FOR ALL
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE tenant_id = current_setting('app.current_tenant', true)
        )
    );

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for tenants updated_at
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for sessions last_activity_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_activity 
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';
