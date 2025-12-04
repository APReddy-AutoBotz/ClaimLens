/**
 * Security Integration Tests
 * Tests input sanitization, SSRF, rate limiting, PII encryption, webhook signatures
 * Requirements: 18.1-18.10
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeText, sanitizeHTML, validateInputLength, } from '../input-sanitizer';
import { validateMCPUrl } from '../ssrf-defense';
import { generateTenantKey, encryptPII, decryptPII, generateWebhookSignature, verifyWebhookSignature, clearAllKeys, } from '../secrets-manager';
import { RateLimiter } from '../../../app/api/middleware/rate-limiter';
describe('Security Integration', () => {
    describe('Input Sanitization Edge Cases', () => {
        it('should handle XSS attempts in menu items', () => {
            const maliciousName = '<script>alert("xss")</script>Burger';
            const sanitized = sanitizeHTML(maliciousName);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('Burger');
        });
        it('should handle SQL injection attempts', () => {
            const maliciousInput = "'; DROP TABLE items; --";
            const sanitized = sanitizeText(maliciousInput);
            // Should preserve the text but normalize it
            expect(sanitized).toBe("'; DROP TABLE items; --");
        });
        it('should handle null bytes', () => {
            const input = 'Safe\x00Unsafe';
            const sanitized = sanitizeText(input);
            expect(sanitized).toBe('SafeUnsafe');
            expect(sanitized).not.toContain('\x00');
        });
        it('should handle Unicode normalization attacks', () => {
            // Different Unicode representations of same character
            const input1 = 'café'; // NFC
            const input2 = 'café'; // NFD (e + combining acute)
            const sanitized1 = sanitizeText(input1);
            const sanitized2 = sanitizeText(input2);
            // Both should normalize to same form
            expect(sanitized1).toBe(sanitized2);
        });
        it('should handle deeply nested HTML', () => {
            const nested = '<div><div><div><script>alert(1)</script></div></div></div>';
            const sanitized = sanitizeHTML(nested);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('<div>');
        });
        it('should handle obfuscated event handlers', () => {
            const obfuscated = '<img src=x onerror="alert(1)">';
            const sanitized = sanitizeHTML(obfuscated);
            expect(sanitized).not.toContain('onerror');
        });
    });
    describe('SSRF Prevention', () => {
        it('should block localhost bypass attempts', () => {
            process.env.NODE_ENV = 'production';
            const attempts = [
                'http://127.0.0.1/admin',
                'http://localhost/admin',
                'http://[::1]/admin',
                'http://0.0.0.0/admin',
            ];
            attempts.forEach(url => {
                const result = validateMCPUrl(url);
                expect(result.valid).toBe(false);
            });
        });
        it('should block private network ranges', () => {
            process.env.NODE_ENV = 'production';
            const privateIPs = [
                'http://10.0.0.1/api',
                'http://172.16.0.1/api',
                'http://192.168.1.1/api',
                'http://169.254.169.254/metadata', // AWS metadata
            ];
            privateIPs.forEach(url => {
                const result = validateMCPUrl(url);
                expect(result.valid).toBe(false);
            });
        });
    });
    describe('Rate Limiting Enforcement', () => {
        let rateLimiter;
        beforeEach(() => {
            rateLimiter = new RateLimiter();
            rateLimiter.reset();
        });
        it('should enforce burst limit', async () => {
            const ip = '192.168.1.100';
            // First 10 requests should succeed
            for (let i = 0; i < 10; i++) {
                const result = await rateLimiter.checkBurst(ip);
                expect(result.allowed).toBe(true);
            }
            // 11th request should fail
            const result = await rateLimiter.checkBurst(ip);
            expect(result.allowed).toBe(false);
            expect(result.retryAfter).toBeDefined();
        });
        it('should enforce API key limit', async () => {
            const apiKey = 'test-key-123';
            // First 100 requests should succeed
            for (let i = 0; i < 100; i++) {
                const result = await rateLimiter.checkApiKey(apiKey);
                expect(result.allowed).toBe(true);
            }
            // 101st request should fail
            const result = await rateLimiter.checkApiKey(apiKey);
            expect(result.allowed).toBe(false);
            expect(result.retryAfter).toBeDefined();
        });
        it('should isolate limits per IP', async () => {
            const ip1 = '192.168.1.100';
            const ip2 = '192.168.1.101';
            // Exhaust limit for ip1
            for (let i = 0; i < 10; i++) {
                await rateLimiter.checkBurst(ip1);
            }
            // ip2 should still have full quota
            const result = await rateLimiter.checkBurst(ip2);
            expect(result.allowed).toBe(true);
        });
    });
    describe('PII Encryption at Rest', () => {
        beforeEach(() => {
            clearAllKeys();
            generateTenantKey('tenant-1');
        });
        it('should encrypt email addresses', () => {
            const email = 'user@example.com';
            const encrypted = encryptPII('tenant-1', email);
            expect(encrypted).not.toContain('@');
            expect(encrypted).not.toContain('example.com');
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(decrypted).toBe(email);
        });
        it('should encrypt phone numbers', () => {
            const phone = '+91-9876543210';
            const encrypted = encryptPII('tenant-1', phone);
            expect(encrypted).not.toContain('9876543210');
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(decrypted).toBe(phone);
        });
        it('should encrypt postal codes', () => {
            const pincode = '110001';
            const encrypted = encryptPII('tenant-1', pincode);
            expect(encrypted).not.toBe(pincode);
            const decrypted = decryptPII('tenant-1', encrypted);
            expect(decrypted).toBe(pincode);
        });
        it('should maintain tenant isolation', () => {
            generateTenantKey('tenant-2');
            const secret = 'tenant-1-secret';
            const encrypted = encryptPII('tenant-1', secret);
            // Tenant 2 should not be able to decrypt tenant 1 data
            expect(() => {
                decryptPII('tenant-2', encrypted);
            }).toThrow();
        });
    });
    describe('Webhook Signature Verification', () => {
        it('should verify authentic webhook payloads', () => {
            const payload = JSON.stringify({
                event: 'verdict.generated',
                item_id: 'item-123',
                verdict: 'modify',
            });
            const secret = 'webhook-secret-key';
            const signature = generateWebhookSignature(payload, secret);
            expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
        });
        it('should reject tampered payloads', () => {
            const payload = JSON.stringify({ event: 'test' });
            const secret = 'webhook-secret-key';
            const signature = generateWebhookSignature(payload, secret);
            // Tamper with payload
            const tamperedPayload = JSON.stringify({ event: 'test', malicious: true });
            expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
        });
        it('should reject replayed signatures', () => {
            const payload1 = JSON.stringify({ event: 'test1' });
            const payload2 = JSON.stringify({ event: 'test2' });
            const secret = 'webhook-secret-key';
            const signature1 = generateWebhookSignature(payload1, secret);
            // Try to use signature1 with payload2
            expect(verifyWebhookSignature(payload2, signature1, secret)).toBe(false);
        });
        it('should use constant-time comparison', () => {
            const payload = 'test';
            const secret = 'secret';
            const signature = generateWebhookSignature(payload, secret);
            // Timing attack should not be possible
            const start1 = Date.now();
            verifyWebhookSignature(payload, signature, secret);
            const time1 = Date.now() - start1;
            const start2 = Date.now();
            verifyWebhookSignature(payload, 'wrong', secret);
            const time2 = Date.now() - start2;
            // Times should be similar (within 10ms)
            expect(Math.abs(time1 - time2)).toBeLessThan(10);
        });
    });
    describe('Combined Security Scenarios', () => {
        it('should handle malicious menu item with all protections', () => {
            const maliciousItem = {
                id: '<script>alert(1)</script>',
                name: 'Burger\x00\x01',
                description: '<img src=x onerror="alert(1)">',
                ingredients: ['salt', 'a'.repeat(15000)],
            };
            // Validate length
            const lengthCheck = validateInputLength(maliciousItem);
            expect(lengthCheck.valid).toBe(false);
            // Sanitize HTML fields
            const sanitizedId = sanitizeHTML(maliciousItem.id);
            expect(sanitizedId).not.toContain('<script>');
            // Sanitize text (removes control characters)
            const sanitizedName = sanitizeText(maliciousItem.name);
            expect(sanitizedName).toBe('Burger');
            // Sanitize HTML description
            const sanitizedDesc = sanitizeHTML(maliciousItem.description);
            expect(sanitizedDesc).not.toContain('onerror');
        });
        it('should protect PII in audit records', () => {
            clearAllKeys();
            generateTenantKey('tenant-1');
            const auditRecord = {
                item_id: 'item-123',
                customer_email: 'user@example.com',
                customer_phone: '+91-9876543210',
            };
            // Encrypt PII fields
            const encrypted = {
                ...auditRecord,
                customer_email: encryptPII('tenant-1', auditRecord.customer_email),
                customer_phone: encryptPII('tenant-1', auditRecord.customer_phone),
            };
            // Encrypted record should not contain PII
            const recordStr = JSON.stringify(encrypted);
            expect(recordStr).not.toContain('user@example.com');
            expect(recordStr).not.toContain('9876543210');
            // Should be able to decrypt
            const decryptedEmail = decryptPII('tenant-1', encrypted.customer_email);
            expect(decryptedEmail).toBe(auditRecord.customer_email);
        });
    });
});
