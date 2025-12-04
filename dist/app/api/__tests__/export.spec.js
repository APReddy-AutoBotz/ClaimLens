/**
 * Export API Tests
 * Tests for GET /v1/export/menu.ndjson endpoint
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { APIGateway } from '../index';
import { InMemoryAuditStorage, AuditManager } from '../../../packages/core';
import { setAuditStorage, resetRateLimits } from '../routes/export';
describe('Export API Routes', () => {
    let gateway;
    let storage;
    let auditManager;
    beforeEach(async () => {
        storage = new InMemoryAuditStorage();
        auditManager = new AuditManager({
            enableStorage: true,
            storageBackend: storage
        });
        // Set the audit storage for the export route
        setAuditStorage(storage);
        // Reset rate limits between tests
        resetRateLimits();
        gateway = new APIGateway();
        await gateway.start(0); // Random port
    });
    afterEach(async () => {
        await gateway.stop();
        storage.clear();
    });
    describe('GET /v1/export/menu.ndjson', () => {
        it('should export cleaned items in NDJSON format', async () => {
            // Create test audit records
            const records = await createTestAuditRecords(auditManager, 'tenant_1', 5);
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            expect(response.headers['content-type']).toContain('application/x-ndjson');
            expect(response.headers['x-total-count']).toBe('5');
            // Parse NDJSON (one JSON object per line)
            const lines = response.text.trim().split('\n');
            expect(lines).toHaveLength(5);
            lines.forEach(line => {
                const item = JSON.parse(line);
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('tenant', 'tenant_1');
                expect(item).toHaveProperty('processed_at');
                expect(item).toHaveProperty('verdict');
                expect(item).toHaveProperty('audit_id');
            });
        });
        it('should scope exports to requesting tenant only', async () => {
            // Create records for different tenants
            await createTestAuditRecords(auditManager, 'tenant_1', 3);
            await createTestAuditRecords(auditManager, 'tenant_2', 2);
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            const lines = response.text.trim().split('\n');
            expect(lines).toHaveLength(3);
            lines.forEach(line => {
                const item = JSON.parse(line);
                expect(item.tenant).toBe('tenant_1');
            });
        });
        it('should support pagination with cursor', async () => {
            // Create 10 records
            await createTestAuditRecords(auditManager, 'tenant_1', 10);
            // First page
            const response1 = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson?limit=5')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            expect(response1.headers['x-total-count']).toBe('5');
            expect(response1.headers['x-next-cursor']).toBeDefined();
            const lines1 = response1.text.trim().split('\n');
            expect(lines1).toHaveLength(5);
            // Second page
            const cursor = response1.headers['x-next-cursor'];
            const response2 = await request(gateway.getApp())
                .get(`/v1/export/menu.ndjson?limit=5&cursor=${cursor}`)
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            const lines2 = response2.text.trim().split('\n');
            expect(lines2).toHaveLength(5);
            // Verify no duplicate items
            const ids1 = lines1.map(l => JSON.parse(l).id);
            const ids2 = lines2.map(l => JSON.parse(l).id);
            const intersection = ids1.filter(id => ids2.includes(id));
            expect(intersection).toHaveLength(0);
        });
        it('should encode and decode cursors correctly', async () => {
            await createTestAuditRecords(auditManager, 'tenant_1', 5);
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson?limit=2')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            const cursor = response.headers['x-next-cursor'];
            expect(cursor).toBeDefined();
            // Cursor should be base64 encoded
            const decoded = Buffer.from(cursor, 'base64').toString();
            const cursorData = JSON.parse(decoded);
            expect(cursorData).toHaveProperty('last_ts');
            expect(cursorData).toHaveProperty('last_id');
        });
        it('should return 400 for invalid cursor', async () => {
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson?cursor=invalid_cursor')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(400);
            expect(response.body.error.code).toBe('BAD_REQUEST');
        });
        it('should enforce rate limit of 10 requests per hour', async () => {
            await createTestAuditRecords(auditManager, 'tenant_1', 1);
            // Make 10 successful requests
            for (let i = 0; i < 10; i++) {
                await request(gateway.getApp())
                    .get('/v1/export/menu.ndjson')
                    .set('Authorization', 'Bearer test_key_tenant1')
                    .expect(200);
            }
            // 11th request should be rate limited
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(429);
            expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        });
        it('should respect limit parameter with max 1000', async () => {
            await createTestAuditRecords(auditManager, 'tenant_1', 50);
            // Request with limit > 1000 should be capped at 1000
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson?limit=2000')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            const lines = response.text.trim().split('\n');
            expect(lines.length).toBeLessThanOrEqual(1000);
        });
        it('should return empty NDJSON for tenant with no records', async () => {
            const response = await request(gateway.getApp())
                .get('/v1/export/menu.ndjson')
                .set('Authorization', 'Bearer test_key_tenant1')
                .expect(200);
            expect(response.text).toBe('');
            expect(response.headers['x-total-count']).toBe('0');
            expect(response.headers['x-next-cursor']).toBeUndefined();
        });
        it('should require authentication', async () => {
            await request(gateway.getApp())
                .get('/v1/export/menu.ndjson')
                .expect(401);
        });
    });
});
/**
 * Helper function to create test audit records
 */
async function createTestAuditRecords(auditManager, tenant, count) {
    const records = [];
    for (let i = 0; i < count; i++) {
        const auditId = auditManager.generateAuditId();
        const item = {
            id: `item_${tenant}_${i}`,
            name: `Test Item ${i}`,
            description: `Description ${i}`,
            ingredients: ['flour', 'sugar']
        };
        const verdict = {
            verdict: i % 2 === 0 ? 'modify' : 'allow',
            changes: i % 2 === 0 ? [{
                    field: 'description',
                    before: `Description ${i}`,
                    after: `Modified Description ${i}`
                }] : [],
            reasons: [{
                    transform: 'test.transform',
                    why: `Test reason ${i}`,
                    source: 'test'
                }],
            audit_id: auditId,
            correlation_id: `corr_${i}`
        };
        const snapshot = auditManager.createSnapshot(item, `Description ${i}`, i % 2 === 0 ? `Modified Description ${i}` : `Description ${i}`);
        const record = auditManager.createAuditRecord(auditId, {
            tenant,
            profile: 'menushield_in',
            route: '/v1/menu/feed',
            correlationId: `corr_${i}`,
            locale: 'en-IN'
        }, item, verdict, [], 10 + i, snapshot);
        await auditManager.saveAuditRecord(record);
        records.push(record);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    return records;
}
