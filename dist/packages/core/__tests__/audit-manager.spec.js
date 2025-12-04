/**
 * Audit Manager Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AuditManager } from '../audit-manager';
import { InMemoryAuditStorage } from '../audit-storage-memory';
describe('AuditManager', () => {
    let auditManager;
    let storage;
    beforeEach(() => {
        storage = new InMemoryAuditStorage();
        auditManager = new AuditManager({
            enableStorage: true,
            storageBackend: storage
        });
    });
    describe('generateAuditId', () => {
        it('should generate unique audit IDs', () => {
            const id1 = auditManager.generateAuditId();
            const id2 = auditManager.generateAuditId();
            expect(id1).toMatch(/^audit_[a-f0-9]{32}$/);
            expect(id2).toMatch(/^audit_[a-f0-9]{32}$/);
            expect(id1).not.toBe(id2);
        });
    });
    describe('createAuditRecord', () => {
        it('should create audit record with all required fields', () => {
            const auditId = auditManager.generateAuditId();
            const item = {
                id: 'item_123',
                name: 'Test Item',
                description: 'Test description',
                ingredients: ['flour', 'sugar']
            };
            const verdict = {
                verdict: 'modify',
                changes: [{
                        field: 'description',
                        before: 'Test description',
                        after: 'Modified description'
                    }],
                reasons: [{
                        transform: 'test.transform',
                        why: 'Test reason',
                        source: 'test'
                    }],
                audit_id: auditId,
                correlation_id: 'corr_123'
            };
            const transformExecutions = [{
                    name: 'test.transform',
                    duration_ms: 10,
                    decision: 'modify'
                }];
            const snapshot = auditManager.createSnapshot(item, 'Test description', 'Modified description');
            const record = auditManager.createAuditRecord(auditId, {
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                correlationId: 'corr_123',
                locale: 'en-IN'
            }, item, verdict, transformExecutions, 15.5, snapshot);
            expect(record.audit_id).toBe(auditId);
            expect(record.tenant).toBe('tenant_1');
            expect(record.profile).toBe('menushield_in');
            expect(record.route).toBe('/v1/menu/feed');
            expect(record.item_id).toBe('item_123');
            expect(record.transforms).toHaveLength(1);
            expect(record.verdict).toBe(verdict);
            expect(record.latency_ms).toBe(15.5);
            expect(record.degraded_mode).toBe(false);
            expect(record.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
        it('should include degraded mode information', () => {
            const auditId = auditManager.generateAuditId();
            const item = {
                id: 'item_123',
                name: 'Test Item',
                ingredients: []
            };
            const verdict = {
                verdict: 'allow',
                changes: [],
                reasons: [],
                audit_id: auditId,
                correlation_id: 'corr_123'
            };
            const snapshot = auditManager.createSnapshot(item, '', '');
            const record = auditManager.createAuditRecord(auditId, {
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                correlationId: 'corr_123',
                locale: 'en-IN',
                degradedMode: true,
                degradedServices: ['ocr.label', 'recall.lookup']
            }, item, verdict, [], 10, snapshot);
            expect(record.degraded_mode).toBe(true);
            expect(record.degraded_services).toEqual(['ocr.label', 'recall.lookup']);
        });
    });
    describe('saveAuditRecord', () => {
        it('should save audit record to storage backend', async () => {
            const auditId = auditManager.generateAuditId();
            const item = {
                id: 'item_123',
                name: 'Test Item',
                ingredients: []
            };
            const verdict = {
                verdict: 'allow',
                changes: [],
                reasons: [],
                audit_id: auditId,
                correlation_id: 'corr_123'
            };
            const snapshot = auditManager.createSnapshot(item, '', '');
            const record = auditManager.createAuditRecord(auditId, {
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                correlationId: 'corr_123',
                locale: 'en-IN'
            }, item, verdict, [], 10, snapshot);
            await auditManager.saveAuditRecord(record);
            const retrieved = await storage.get(auditId);
            expect(retrieved).toEqual(record);
        });
    });
    describe('getAuditRecord', () => {
        it('should retrieve audit record by ID', async () => {
            const auditId = auditManager.generateAuditId();
            const item = {
                id: 'item_123',
                name: 'Test Item',
                ingredients: []
            };
            const verdict = {
                verdict: 'allow',
                changes: [],
                reasons: [],
                audit_id: auditId,
                correlation_id: 'corr_123'
            };
            const snapshot = auditManager.createSnapshot(item, '', '');
            const record = auditManager.createAuditRecord(auditId, {
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                correlationId: 'corr_123',
                locale: 'en-IN'
            }, item, verdict, [], 10, snapshot);
            await auditManager.saveAuditRecord(record);
            const retrieved = await auditManager.getAuditRecord(auditId);
            expect(retrieved).toEqual(record);
        });
        it('should return null for non-existent audit ID', async () => {
            const retrieved = await auditManager.getAuditRecord('non_existent');
            expect(retrieved).toBeNull();
        });
    });
    describe('queryAuditRecords', () => {
        beforeEach(async () => {
            // Create multiple audit records
            for (let i = 0; i < 5; i++) {
                const auditId = auditManager.generateAuditId();
                const item = {
                    id: `item_${i}`,
                    name: `Test Item ${i}`,
                    ingredients: []
                };
                const verdict = {
                    verdict: 'allow',
                    changes: [],
                    reasons: [],
                    audit_id: auditId,
                    correlation_id: `corr_${i}`
                };
                const snapshot = auditManager.createSnapshot(item, '', '');
                const record = auditManager.createAuditRecord(auditId, {
                    tenant: i < 3 ? 'tenant_1' : 'tenant_2',
                    profile: 'menushield_in',
                    route: '/v1/menu/feed',
                    correlationId: `corr_${i}`,
                    locale: 'en-IN'
                }, item, verdict, [], 10, snapshot);
                await auditManager.saveAuditRecord(record);
            }
        });
        it('should query records by tenant', async () => {
            const results = await auditManager.queryAuditRecords({
                tenant: 'tenant_1'
            });
            expect(results).toHaveLength(3);
            results.forEach(r => expect(r.tenant).toBe('tenant_1'));
        });
        it('should query records by item ID', async () => {
            const results = await auditManager.queryAuditRecords({
                itemId: 'item_2'
            });
            expect(results).toHaveLength(1);
            expect(results[0].item_id).toBe('item_2');
        });
        it('should apply limit to results', async () => {
            const results = await auditManager.queryAuditRecords({
                limit: 2
            });
            expect(results).toHaveLength(2);
        });
    });
    describe('createSnapshot', () => {
        it('should create content snapshot', () => {
            const item = {
                id: 'item_123',
                name: 'Test Item',
                description: 'Original description',
                ingredients: ['flour', 'sugar']
            };
            const snapshot = auditManager.createSnapshot(item, 'Original description', 'Modified description');
            expect(snapshot.before.item).toEqual(item);
            expect(snapshot.before.content).toBe('Original description');
            expect(snapshot.after.content).toBe('Modified description');
        });
    });
});
