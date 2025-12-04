/**
 * Authentication Service
 * JWT token generation, validation, password hashing, and MFA
 */
import * as crypto from 'crypto';
// ============================================================================
// Password Hashing (bcrypt-compatible)
// ============================================================================
const SALT_ROUNDS = 12;
/**
 * Hash a password using bcrypt-compatible algorithm
 */
export async function hashPassword(password) {
    // In production, use bcrypt library
    // For now, using crypto.pbkdf2 as a placeholder
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}
/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SESSION_DURATION_HOURS = 8;
/**
 * Generate a JWT token for a user
 */
export function generateToken(user, sessionId) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (SESSION_DURATION_HOURS * 60 * 60);
    const payload = {
        user_id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        role: user.role,
        session_id: sessionId,
        iat: now,
        exp,
    };
    // Simple JWT implementation (in production, use jsonwebtoken library)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}
/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
    try {
        const [header, body, signature] = token.split('.');
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');
        if (signature !== expectedSignature) {
            return null;
        }
        // Decode payload
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null;
        }
        return payload;
    }
    catch (error) {
        return null;
    }
}
/**
 * Hash a token for storage (to prevent token theft from database)
 */
export function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
// ============================================================================
// Session Management
// ============================================================================
/**
 * Create a new session
 */
export function createSession(userId) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
    return { sessionId, expiresAt };
}
/**
 * Check if a session is expired
 */
export function isSessionExpired(session) {
    return new Date(session.expires_at) < new Date();
}
/**
 * Check if a session should be expired due to inactivity (8 hours)
 */
export function isSessionInactive(session) {
    const lastActivity = new Date(session.last_activity_at);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    return hoursSinceActivity >= SESSION_DURATION_HOURS;
}
// ============================================================================
// Multi-Factor Authentication (MFA)
// ============================================================================
/**
 * Generate a new MFA secret (TOTP)
 */
export function generateMFASecret() {
    // Generate a base32-encoded secret (32 characters)
    const buffer = crypto.randomBytes(20);
    return base32Encode(buffer);
}
/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTP(secret, code) {
    const now = Math.floor(Date.now() / 1000);
    const window = 30; // 30-second time window
    const counter = Math.floor(now / window);
    // Check current window and ±1 window for clock drift
    for (let i = -1; i <= 1; i++) {
        const expectedCode = generateTOTP(secret, counter + i);
        if (expectedCode === code) {
            return true;
        }
    }
    return false;
}
/**
 * Generate a TOTP code for a given counter
 */
function generateTOTP(secret, counter) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));
    const secretBuffer = base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buffer);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}
/**
 * Base32 encoding (for MFA secrets)
 */
function base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
}
/**
 * Base32 decoding (for MFA secrets)
 */
function base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = Buffer.alloc(Math.ceil((str.length * 5) / 8));
    for (let i = 0; i < str.length; i++) {
        const char = str[i].toUpperCase();
        const charValue = alphabet.indexOf(char);
        if (charValue === -1)
            continue;
        value = (value << 5) | charValue;
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return output.slice(0, index);
}
/**
 * Generate a QR code URL for MFA setup
 */
export function generateMFAQRCodeURL(email, secret, issuer = 'ClaimLens') {
    const label = encodeURIComponent(`${issuer}:${email}`);
    const params = new URLSearchParams({
        secret,
        issuer,
        algorithm: 'SHA1',
        digits: '6',
        period: '30',
    });
    return `otpauth://totp/${label}?${params.toString()}`;
}
