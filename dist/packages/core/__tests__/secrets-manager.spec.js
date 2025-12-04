/**
 * Secrets Manager Tests
 * Requirements: 22.3
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateTenantKey, loadTenantKey, encryptPII, decryptPII, hashWebhookSecret, verifyWebhookSecret, generateWebhookSignature, verifyWebhookSignature, rotateTenantKey, clearAllKeys, } from '../secrets-manager';
describe('Secrets Manager', () => {
    beforeEach(() => {
        clearAllKeys();
    });
    describe('Tenant Key Management', () => {
        it('should generate unique keys for different tenants', () => {
            const key1 = generateTenantKey('tenant-1');
            const key2 = generateTenantKey('tenant-2');
            expect(key1).not.toBe(key2);
            expect(key1.length).toBeGreaterThan(0);
            expect(key2.length).toBeGreaterThan(0);
        });
        it('should load tenant key from base64', () => {
            const keyBase64 = generateTenantKey('tenant-1');
            clearAllKeys();
            loadTenantKey('tenant-1', keyBase64);
            // Should be able to encrypt/decrypt after loading
            const encrypted = encryptPII('tenant-1', 'test data');
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(decrypted).toBe('test data');
        });
        it('should reject invalid key length', () => {
            expect(() => {
                loadTenantKey('tenant-1', 'invalid-short-key');
            }).toThrow('Invalid key length');
        });
    });
    describe('PII Encryption', () => {
        beforeEach(() => {
            generateTenantKey('tenant-1');
        });
        it('should encrypt and decrypt PII', () => {
            const plaintext = 'user@example.com';
            const encrypted = encryptPII('tenant-1', plaintext);
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(encrypted).not.toBe(plaintext);
            expect(decrypted).toBe(plaintext);
        });
        it('should produce different ciphertext for same plaintext', () => {
            const plaintext = 'sensitive data';
            const encrypted1 = encryptPII('tenant-1', plaintext);
            const encrypted2 = encryptPII('tenant-1', plaintext);
            // Different IVs should produce different ciphertext
            expect(encrypted1).not.toBe(encrypted2);
            // But both should decrypt to same plaintext
            expect(decryptPII('tenant-1', encrypted1)).toBe(plaintext);
            expect(decryptPII('tenant-1', encrypted2)).toBe(plaintext);
        });
        it('should handle empty strings', () => {
            expect(encryptPII('tenant-1', '')).toBe('');
            expect(decryptPII('tenant-1', '')).toBe('');
        });
        it('should handle Unicode text', () => {
            const plaintext = '🔒 Secure data with émojis and àccents';
            const encrypted = encryptPII('tenant-1', plaintext);
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(decrypted).toBe(plaintext);
        });
        it('should fail with wrong tenant key', () => {
            generateTenantKey('tenant-2');
            const encrypted = encryptPII('tenant-1', 'secret');
            expect(() => {
                decryptPII('tenant-2', encrypted);
            }).toThrow();
        });
        it('should fail with tampered ciphertext', () => {
            const encrypted = encryptPII('tenant-1', 'secret');
            const tampered = encrypted.slice(0, -4) + 'XXXX';
            expect(() => {
                decryptPII('tenant-1', tampered);
            }).toThrow();
        });
    });
    describe('Webhook Secret Management', () => {
        it('should hash webhook secret', () => {
            const secret = 'my-webhook-secret';
            const hash = hashWebhookSecret(secret);
            expect(hash).not.toBe(secret);
            expect(hash.length).toBeGreaterThan(0);
        });
        it('should verify correct secret', () => {
            const secret = 'my-webhook-secret';
            const hash = hashWebhookSecret(secret);
            expect(verifyWebhookSecret(secret, hash)).toBe(true);
        });
        it('should reject incorrect secret', () => {
            const secret = 'my-webhook-secret';
            const hash = hashWebhookSecret(secret);
            expect(verifyWebhookSecret('wrong-secret', hash)).toBe(false);
        });
        it('should produce different hashes for same secret', () => {
            const secret = 'my-webhook-secret';
            const hash1 = hashWebhookSecret(secret);
            const hash2 = hashWebhookSecret(secret);
            // Different salts should produce different hashes
            expect(hash1).not.toBe(hash2);
            // But both should verify correctly
            expect(verifyWebhookSecret(secret, hash1)).toBe(true);
            expect(verifyWebhookSecret(secret, hash2)).toBe(true);
        });
    });
    describe('Webhook Signature', () => {
        it('should generate HMAC signature', () => {
            const payload = JSON.stringify({ event: 'test' });
            const secret = 'webhook-secret';
            const signature = generateWebhookSignature(payload, secret);
            expect(signature).toHaveLength(64); // SHA-256 hex = 64 chars
            expect(signature).toMatch(/^[a-f0-9]+$/);
        });
        it('should verify correct signature', () => {
            const payload = JSON.stringify({ event: 'test' });
            const secret = 'webhook-secret';
            const signature = generateWebhookSignature(payload, secret);
            expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
        });
        it('should reject incorrect signature', () => {
            const payload = JSON.stringify({ event: 'test' });
            const secret = 'webhook-secret';
            const signature = generateWebhookSignature(payload, secret);
            const wrongSignature = signature.slice(0, -2) + 'ff';
            expect(verifyWebhookSignature(payload, wrongSignature, secret)).toBe(false);
        });
        it('should reject tampered payload', () => {
            const payload = JSON.stringify({ event: 'test' });
            const secret = 'webhook-secret';
            const signature = generateWebhookSignature(payload, secret);
            const tamperedPayload = JSON.stringify({ event: 'tampered' });
            expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
        });
        it('should use timing-safe comparison', () => {
            const payload = 'test';
            const secret = 'secret';
            const signature = generateWebhookSignature(payload, secret);
            // Invalid hex should not throw, just return false
            expect(verifyWebhookSignature(payload, 'invalid', secret)).toBe(false);
        });
    });
    describe('Key Rotation', () => {
        it('should rotate tenant key', async () => {
            generateTenantKey('tenant-1');
            const originalData = 'sensitive data';
            const encrypted = encryptPII('tenant-1', originalData);
            let reEncryptedData = '';
            await rotateTenantKey('tenant-1', async (decrypt, encrypt) => {
                const decrypted = decrypt(encrypted);
                reEncryptedData = encrypt(decrypted);
            });
            // Should be able to decrypt with new key
            const decrypted = decryptPII('tenant-1', reEncryptedData);
            expect(decrypted).toBe(originalData);
            // Old encrypted data should no longer work
            expect(() => {
                decryptPII('tenant-1', encrypted);
            }).toThrow();
        });
        it('should handle multiple data items during rotation', async () => {
            generateTenantKey('tenant-1');
            const data = ['email@example.com', '+91-9876543210', '110001'];
            const encrypted = data.map(d => encryptPII('tenant-1', d));
            const reEncrypted = [];
            await rotateTenantKey('tenant-1', async (decrypt, encrypt) => {
                for (const enc of encrypted) {
                    const dec = decrypt(enc);
                    reEncrypted.push(encrypt(dec));
                }
            });
            // All data should decrypt correctly with new key
            const decrypted = reEncrypted.map(e => decryptPII('tenant-1', e));
            expect(decrypted).toEqual(data);
        });
    });
});
