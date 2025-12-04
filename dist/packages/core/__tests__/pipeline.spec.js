/**
 * Tests for Transform Pipeline Engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TransformPipeline, TransformRegistry } from '../pipeline.js';
describe('TransformRegistry', () => {
    let registry;
    beforeEach(() => {
        registry = new TransformRegistry();
    });
    it('should register a transform', () => {
        const mockTransform = (input) => ({
            text: input,
            modified: false,
            flags: []
        });
        registry.register('test.transform', mockTransform);
        expect(registry.has('test.transform')).toBe(true);
        expect(registry.get('test.transform')).toBe(mockTransform);
    });
    it('should list all registered transforms', () => {
        const transform1 = (input) => ({ text: input, modified: false, flags: [] });
        const transform2 = (input) => ({ text: input, modified: false, flags: [] });
        registry.register('transform1', transform1);
        registry.register('transform2', transform2);
        const list = registry.list();
        expect(list).toContain('transform1');
        expect(list).toContain('transform2');
        expect(list.length).toBe(2);
    });
    it('should return undefined for unregistered transform', () => {
        expect(registry.get('nonexistent')).toBeUndefined();
        expect(registry.has('nonexistent')).toBe(false);
    });
});
describe('TransformPipeline', () => {
    let pipeline;
    beforeEach(() => {
        pipeline = new TransformPipeline();
    });
    it('should load policy', () => {
        const policy = {
            version: '1.0.0',
            profiles: {
                test: {
                    name: 'test',
                    routes: [
                        {
                            path: '/test',
                            transforms: ['transform1'],
                            latency_budget_ms: 100
                        }
                    ]
                }
            }
        };
        pipeline.loadPolicy(policy);
        // No error means success
        expect(true).toBe(true);
    });
    it('should register transforms', () => {
        const mockTransform = (input) => ({
            text: input,
            modified: false,
            flags: []
        });
        pipeline.registerTransform('test.transform', mockTransform);
        const registry = pipeline.getRegistry();
        expect(registry.has('test.transform')).toBe(true);
    });
    it('should execute pipeline with no modifications', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {
                test: {
                    name: 'test',
                    routes: [
                        {
                            path: '/test',
                            transforms: ['passthrough'],
                            latency_budget_ms: 100
                        }
                    ]
                }
            }
        };
        const passthroughTransform = (input) => ({
            text: input,
            modified: false,
            flags: []
        });
        pipeline.loadPolicy(policy);
        pipeline.registerTransform('passthrough', passthroughTransform);
        const item = {
            id: '1',
            name: 'Test Item',
            description: 'Test description',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const verdict = await pipeline.execute(item, 'test', context);
        expect(verdict.verdict).toBe('allow');
        expect(verdict.changes).toHaveLength(0);
        expect(verdict.correlation_id).toBe('test-123');
    });
    it('should execute pipeline with modifications', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {
                test: {
                    name: 'test',
                    routes: [
                        {
                            path: '/test',
                            transforms: ['modifier'],
                            latency_budget_ms: 100
                        }
                    ]
                }
            }
        };
        const modifierTransform = (input) => ({
            text: input + ' [MODIFIED]',
            modified: true,
            flags: [
                {
                    kind: 'warn',
                    label: 'Modified',
                    explanation: 'Content was modified'
                }
            ]
        });
        pipeline.loadPolicy(policy);
        pipeline.registerTransform('modifier', modifierTransform);
        const item = {
            id: '1',
            name: 'Test Item',
            description: 'Test description',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-456'
        };
        const verdict = await pipeline.execute(item, 'test', context);
        expect(verdict.verdict).toBe('modify');
        expect(verdict.changes).toHaveLength(1);
        expect(verdict.changes[0].after).toBe('Test description [MODIFIED]');
        expect(verdict.reasons).toHaveLength(1);
        expect(verdict.reasons[0].why).toBe('Content was modified');
    });
    it('should handle multiple transforms in sequence', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {
                test: {
                    name: 'test',
                    routes: [
                        {
                            path: '/test',
                            transforms: ['transform1', 'transform2'],
                            latency_budget_ms: 200
                        }
                    ]
                }
            }
        };
        const transform1 = (input) => ({
            text: input + ' [T1]',
            modified: true,
            flags: []
        });
        const transform2 = (input) => ({
            text: input + ' [T2]',
            modified: true,
            flags: []
        });
        pipeline.loadPolicy(policy);
        pipeline.registerTransform('transform1', transform1);
        pipeline.registerTransform('transform2', transform2);
        const item = {
            id: '1',
            name: 'Test',
            description: 'Original',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-789'
        };
        const verdict = await pipeline.execute(item, 'test', context);
        expect(verdict.verdict).toBe('modify');
        expect(verdict.changes).toHaveLength(2);
        expect(verdict.changes[1].after).toBe('Original [T1] [T2]');
    });
    it('should handle transform errors gracefully', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {
                test: {
                    name: 'test',
                    routes: [
                        {
                            path: '/test',
                            transforms: ['failing', 'working'],
                            latency_budget_ms: 100
                        }
                    ]
                }
            }
        };
        const failingTransform = () => {
            throw new Error('Transform failed');
        };
        const workingTransform = (input) => ({
            text: input + ' [OK]',
            modified: true,
            flags: []
        });
        pipeline.loadPolicy(policy);
        pipeline.registerTransform('failing', failingTransform);
        pipeline.registerTransform('working', workingTransform);
        const item = {
            id: '1',
            name: 'Test',
            description: 'Test',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-error'
        };
        const verdict = await pipeline.execute(item, 'test', context);
        // Should continue despite error
        expect(verdict.changes.length).toBeGreaterThan(0);
        expect(verdict.reasons.some(r => r.why.includes('Transform failed'))).toBe(true);
    });
    it('should throw error if policy not loaded', async () => {
        const item = {
            id: '1',
            name: 'Test',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test'
        };
        await expect(pipeline.execute(item, 'test', context)).rejects.toThrow('Policy not loaded');
    });
    it('should throw error for unknown profile', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {}
        };
        pipeline.loadPolicy(policy);
        const item = {
            id: '1',
            name: 'Test',
            ingredients: []
        };
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test'
        };
        await expect(pipeline.execute(item, 'unknown', context)).rejects.toThrow('Profile unknown not found');
    });
});
