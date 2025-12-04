/**
 * Secrets Management
 * Per-tenant encryption keys, PII encryption at rest, webhook secrets
 * Requirements: 22.3
 */
import crypto from 'crypto';
/**
 * Encryption algorithm and configuration
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;
/**
 * In-memory key store (in production, use secure key management service)
 * Maps tenant_id to encryption key
 */
const TENANT_KEYS = new Map();
/**
 * Generate a new AES-256 encryption key for a tenant
 */
export function generateTenantKey(tenantId) {
    const key = crypto.randomBytes(KEY_LENGTH);
    TENANT_KEYS.set(tenantId, key);
    // Return base64-encoded key for storage
    return key.toString('base64');
}
/**
 * Load tenant key from storage
 */
export function loadTenantKey(tenantId, keyBase64) {
    const key = Buffer.from(keyBase64, 'base64');
    if (key.length !== KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes, got ${key.length}`);
    }
    TENANT_KEYS.set(tenantId, key);
}
/**
 * Get tenant encryption key
 */
function getTenantKey(tenantId) {
    const key = TENANT_KEYS.get(tenantId);
    if (!key) {
        throw new Error(`No encryption key found for tenant: ${tenantId}`);
    }
    return key;
}
/**
 * Encrypt PII data at rest
 * Returns base64-encoded encrypted data with IV and auth tag
 */
export function encryptPII(tenantId, plaintext) {
    if (!plaintext) {
        return '';
    }
    const key = getTenantKey(tenantId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'base64'),
        authTag,
    ]);
    return combined.toString('base64');
}
/**
 * Decrypt PII data
 * Accepts base64-encoded encrypted data with IV and auth tag
 */
export function decryptPII(tenantId, encryptedBase64) {
    if (!encryptedBase64) {
        return '';
    }
    const key = getTenantKey(tenantId);
    const combined = Buffer.from(encryptedBase64, 'base64');
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Hash webhook secret for secure storage
 * Uses SHA-256 with salt
 */
export function hashWebhookSecret(secret) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
    // Combine salt + hash for storage
    const combined = Buffer.concat([salt, hash]);
    return combined.toString('base64');
}
/**
 * Verify webhook secret against stored hash
 */
export function verifyWebhookSecret(secret, storedHash) {
    const combined = Buffer.from(storedHash, 'base64');
    const salt = combined.subarray(0, 16);
    const storedHashBuffer = combined.subarray(16);
    const hash = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
    return crypto.timingSafeEqual(hash, storedHashBuffer);
}
/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
}
/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = generateWebhookSignature(payload, secret);
    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    catch {
        return false;
    }
}
/**
 * Rotate tenant encryption key
 * Re-encrypts all PII data with new key
 */
export async function rotateTenantKey(tenantId, reEncryptCallback) {
    const oldKey = getTenantKey(tenantId);
    // Generate new key
    const newKeyBase64 = generateTenantKey(`${tenantId}_new`);
    // Create decrypt/encrypt functions
    const oldDecrypt = (data) => decryptPII(tenantId, data);
    const newEncrypt = (data) => {
        const key = TENANT_KEYS.get(`${tenantId}_new`);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();
        const combined = Buffer.concat([
            iv,
            Buffer.from(encrypted, 'base64'),
            authTag,
        ]);
        return combined.toString('base64');
    };
    // Re-encrypt all data
    await reEncryptCallback(oldDecrypt, newEncrypt);
    // Replace old key with new key
    TENANT_KEYS.set(tenantId, TENANT_KEYS.get(`${tenantId}_new`));
    TENANT_KEYS.delete(`${tenantId}_new`);
    return newKeyBase64;
}
/**
 * Clear all keys (for testing)
 */
export function clearAllKeys() {
    TENANT_KEYS.clear();
}
/**
 * Key rotation policy documentation
 */
export const KEY_ROTATION_POLICY = `
# Encryption Key Rotation Policy

## Schedule
- Tenant encryption keys MUST be rotated every 90 days
- Webhook secrets SHOULD be rotated every 180 days
- Emergency rotation MUST occur within 24 hours of suspected compromise

## Procedure
1. Generate new encryption key using generateTenantKey()
2. Re-encrypt all PII data using rotateTenantKey()
3. Update key in secure key management service
4. Verify all data can be decrypted with new key
5. Archive old key for 30 days (for recovery)
6. Securely delete old key after 30 days

## Verification
- Run daily job to check key age
- Alert if key is older than 85 days (5-day warning)
- Block operations if key is older than 95 days (force rotation)

## Recovery
- Old keys archived for 30 days in secure storage
- Recovery requires admin approval + audit log entry
- Recovered data must be re-encrypted with current key
`;
