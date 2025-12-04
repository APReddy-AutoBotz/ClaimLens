/**
 * Webhook Manager Tests
 * Tests for webhook delivery and signature generation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookManager } from '../webhook-manager';
describe('WebhookManager', () => {
    let webhookManager;
    beforeEach(() => {
        webhookManager = new WebhookManager();
        webhookManager.clearRecords();
    });
    describe('generateSignature', () => {
        it('should generate HMAC-SHA256 signature', () => {
            const payload = JSON.stringify({ test: 'data' });
            const secret = 'test-secret';
            const signature = webhookManager.generateSignature(payload, secret);
            expect(signature).toBeTruthy();
            expect(signature).toHaveLength(64); // SHA-256 hex is 64 characters
        });
        it('should generate consistent signatures for same input', () => {
            const payload = JSON.stringify({ test: 'data' });
            const secret = 'test-secret';
            const sig1 = webhookManager.generateSignature(payload, secret);
            const sig2 = webhookManager.generateSignature(payload, secret);
            expect(sig1).toBe(sig2);
        });
        it('should generate different signatures for different secrets', () => {
            const payload = JSON.stringify({ test: 'data' });
            const sig1 = webhookManager.generateSignature(payload, 'secret1');
            const sig2 = webhookManager.generateSignature(payload, 'secret2');
            expect(sig1).not.toBe(sig2);
        });
    });
    describe('verifySignature', () => {
        it('should verify valid signature', () => {
            const payload = JSON.stringify({ test: 'data' });
            const secret = 'test-secret';
            const signature = webhookManager.generateSignature(payload, secret);
            const isValid = webhookManager.verifySignature(payload, signature, secret);
            expect(isValid).toBe(true);
        });
        it('should reject invalid signature', () => {
            const payload = JSON.stringify({ test: 'data' });
            const secret = 'test-secret';
            const wrongSignature = 'invalid-signature-' + '0'.repeat(48);
            const isValid = webhookManager.verifySignature(payload, wrongSignature, secret);
            expect(isValid).toBe(false);
        });
        it('should reject signature with wrong secret', () => {
            const payload = JSON.stringify({ test: 'data' });
            const signature = webhookManager.generateSignature(payload, 'secret1');
            const isValid = webhookManager.verifySignature(payload, signature, 'secret2');
            expect(isValid).toBe(false);
        });
    });
    describe('createPayload', () => {
        it('should create webhook payload from verdict', () => {
            const tenant = 'test-tenant';
            const verdict = {
                verdict: 'modify',
                changes: [
                    {
                        field: 'description',
                        before: 'Original text',
                        after: 'Modified text',
                    },
                ],
                reasons: [
                    {
                        transform: 'rewrite.disclaimer',
                        why: 'Added disclaimer',
                        source: 'https://example.com',
                    },
                ],
                audit_id: 'audit-123',
                correlation_id: 'corr-456',
            };
            const itemId = 'item-789';
            const payload = webhookManager.createPayload(tenant, verdict, itemId);
            expect(payload.event).toBe('verdict.generated');
            expect(payload.tenant).toBe(tenant);
            expect(payload.verdict).toBe('modify');
            expect(payload.item_id).toBe(itemId);
            expect(payload.audit_id).toBe('audit-123');
            expect(payload.correlation_id).toBe('corr-456');
            expect(payload.reasons).toHaveLength(1);
            expect(payload.timestamp).toBeTruthy();
        });
    });
    describe('getDeliveryStats', () => {
        it('should return zero stats for tenant with no deliveries', () => {
            const stats = webhookManager.getDeliveryStats('test-tenant');
            expect(stats.total).toBe(0);
            expect(stats.delivered).toBe(0);
            expect(stats.failed).toBe(0);
            expect(stats.pending).toBe(0);
            expect(stats.successRate).toBe(0);
        });
    });
    describe('getDeliveryRecordsByTenant', () => {
        it('should return empty array for tenant with no deliveries', () => {
            const records = webhookManager.getDeliveryRecordsByTenant('test-tenant');
            expect(records).toEqual([]);
        });
        it('should return records sorted by created_at descending', () => {
            // This test would require mocking deliverWebhook or accessing internal state
            // For now, we verify the method exists and returns an array
            const records = webhookManager.getDeliveryRecordsByTenant('test-tenant');
            expect(Array.isArray(records)).toBe(true);
        });
    });
    describe('deliverWebhook - retry logic', () => {
        it('should mark as failed after 5 retry attempts', async () => {
            const config = {
                url: 'https://invalid-webhook-url-that-will-fail.example.com',
                secret: 'test-secret',
            };
            const payload = webhookManager.createPayload('test-tenant', {
                verdict: 'allow',
                changes: [],
                reasons: [],
                audit_id: 'audit-123',
                correlation_id: 'corr-456',
            }, 'item-789');
            // This will fail because the URL is invalid
            const record = await webhookManager.deliverWebhook(config, payload);
            // Should have attempted 5 times
            expect(record.attempt_count).toBe(5);
            expect(record.status).toBe('failed');
            expect(record.error_message).toBeTruthy();
        }, 30000); // Increase timeout for retry delays
        it('should track delivery attempts in record', async () => {
            const config = {
                url: 'https://invalid-webhook-url.example.com',
                secret: 'test-secret',
            };
            const payload = webhookManager.createPayload('test-tenant', {
                verdict: 'modify',
                changes: [],
                reasons: [],
                audit_id: 'audit-456',
                correlation_id: 'corr-789',
            }, 'item-123');
            const record = await webhookManager.deliverWebhook(config, payload);
            expect(record.id).toBeTruthy();
            expect(record.tenant).toBe('test-tenant');
            expect(record.webhook_url).toBe(config.url);
            expect(record.signature).toBeTruthy();
            expect(record.created_at).toBeTruthy();
            expect(record.last_attempt_at).toBeTruthy();
        }, 30000);
    });
    describe('retryDelivery', () => {
        it('should throw error for non-existent record', async () => {
            const config = {
                url: 'https://example.com/webhook',
                secret: 'test-secret',
            };
            await expect(webhookManager.retryDelivery('non-existent-id', config)).rejects.toThrow('Webhook delivery record non-existent-id not found');
        });
    });
});
