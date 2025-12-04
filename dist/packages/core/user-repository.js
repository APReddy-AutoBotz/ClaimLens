/**
 * User Repository
 * Database operations for users, sessions, and authentication
 */
import { hashPassword, verifyPassword, createSession, hashToken } from './auth-service';
export class UserRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    // ============================================================================
    // Tenant Operations
    // ============================================================================
    async createTenant(id, name) {
        const result = await this.pool.query(`INSERT INTO tenants (id, name) VALUES ($1, $2) RETURNING *`, [id, name]);
        return result.rows[0];
    }
    async getTenant(id) {
        const result = await this.pool.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    async createTenantConfig(config) {
        const result = await this.pool.query(`INSERT INTO tenant_config (tenant, retention_days, webhook_url, webhook_secret, allowed_locales, custom_rule_packs)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
            config.tenant,
            config.retention_days || 90,
            config.webhook_url,
            config.webhook_secret,
            config.allowed_locales || ['en-IN'],
            config.custom_rule_packs || [],
        ]);
        return result.rows[0];
    }
    async getTenantConfig(tenant) {
        const result = await this.pool.query(`SELECT * FROM tenant_config WHERE tenant = $1`, [tenant]);
        return result.rows[0] || null;
    }
    // ============================================================================
    // User Operations
    // ============================================================================
    async createUser(id, tenantId, email, password, role) {
        const passwordHash = await hashPassword(password);
        const result = await this.pool.query(`INSERT INTO users (id, tenant_id, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [id, tenantId, email, passwordHash, role]);
        return result.rows[0];
    }
    async getUserById(id) {
        const result = await this.pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    async getUserByEmail(email) {
        const result = await this.pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        return result.rows[0] || null;
    }
    async updateUserLastLogin(userId) {
        await this.pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);
    }
    async enableMFA(userId, secret) {
        await this.pool.query(`UPDATE users SET mfa_enabled = true, mfa_secret = $1 WHERE id = $2`, [secret, userId]);
    }
    async disableMFA(userId) {
        await this.pool.query(`UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1`, [userId]);
    }
    // ============================================================================
    // Session Operations
    // ============================================================================
    async createUserSession(userId, token) {
        const { sessionId, expiresAt } = createSession(userId);
        const tokenHash = hashToken(token);
        const result = await this.pool.query(`INSERT INTO sessions (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`, [sessionId, userId, tokenHash, expiresAt]);
        return result.rows[0];
    }
    async getSession(sessionId) {
        const result = await this.pool.query(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);
        return result.rows[0] || null;
    }
    async getSessionByToken(tokenHash) {
        const result = await this.pool.query(`SELECT * FROM sessions WHERE token_hash = $1`, [tokenHash]);
        return result.rows[0] || null;
    }
    async updateSessionActivity(sessionId) {
        await this.pool.query(`UPDATE sessions SET last_activity_at = NOW() WHERE id = $1`, [sessionId]);
    }
    async deleteSession(sessionId) {
        await this.pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
    }
    async deleteExpiredSessions() {
        const result = await this.pool.query(`DELETE FROM sessions WHERE expires_at < NOW()`);
        return result.rowCount || 0;
    }
    async deleteUserSessions(userId) {
        await this.pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    }
    // ============================================================================
    // API Key Operations
    // ============================================================================
    async createApiKey(tenant, keyHash, name, expiresAt) {
        const result = await this.pool.query(`INSERT INTO api_keys (tenant, key_hash, name, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`, [tenant, keyHash, name, expiresAt]);
        return result.rows[0];
    }
    async getApiKeyByHash(keyHash) {
        const result = await this.pool.query(`SELECT * FROM api_keys WHERE key_hash = $1`, [keyHash]);
        return result.rows[0] || null;
    }
    async updateApiKeyLastUsed(id) {
        await this.pool.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [id]);
    }
    // ============================================================================
    // Authentication
    // ============================================================================
    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return null;
        }
        return user;
    }
    // ============================================================================
    // Tenant Context (for Row-Level Security)
    // ============================================================================
    async setTenantContext(tenantId) {
        await this.pool.query(`SET LOCAL app.current_tenant = $1`, [tenantId]);
    }
    async clearTenantContext() {
        await this.pool.query(`RESET app.current_tenant`);
    }
}
