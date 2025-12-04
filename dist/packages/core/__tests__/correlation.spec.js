/**
 * Tests for Correlation ID Propagation
 * Requirements: 17.5, 25.7, 25.8
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../logger';
import { TransformPipeline } from '../pipeline';
describe('Correlation ID Propagation (Req 17.5, 25.7, 25.8)', () => {
    let logger;
    let consoleLogSpy;
    beforeEach(() => {
        logger = new Logger({ enableSampling: false });
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    });
    describe('Logger Correlation ID (Req 17.5)', () => {
        it('should include correlation ID in all log entries', () => {
            const correlationId = 'test-correlation-123';
            logger.info({
                request_id: correlationId,
                tenant: 'test-tenant',
                route: '/v1/menu/feed',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.request_id).toBe(correlationId);
        });
        it('should propagate correlation ID through multiple log calls', () => {
            const correlationId = 'test-correlation-456';
            logger.info({
                request_id: correlationId,
                route: '/v1/menu/feed',
                transform: 'redact.pii',
            });
            logger.info({
                request_id: correlationId,
                route: '/v1/menu/feed',
                transform: 'detect.allergens',
            });
            logger.info({
                request_id: correlationId,
                route: '/v1/menu/feed',
                transform: 'rewrite.disclaimer',
            });
            expect(consoleLogSpy).toHaveBeenCalledTimes(3);
            const logs = consoleLogSpy.mock.calls.map((call) => JSON.parse(call[0]));
            // All logs should have the same correlation ID
            expect(logs[0].request_id).toBe(correlationId);
            expect(logs[1].request_id).toBe(correlationId);
            expect(logs[2].request_id).toBe(correlationId);
        });
    });
    describe('Pipeline Correlation ID (Req 25.7)', () => {
        let pipeline;
        beforeEach(() => {
            pipeline = new TransformPipeline();
            // Load minimal policy
            pipeline.loadPolicy({
                version: '1.0.0',
                profiles: {
                    test_profile: {
                        name: 'test_profile',
                        routes: [{
                                path: '/test',
                                transforms: ['test.transform'],
                                latency_budget_ms: 1000,
                            }],
                    },
                },
            });
            // Register a simple test transform
            pipeline.registerTransform('test.transform', async (text, context) => {
                return {
                    text,
                    modified: false,
                    flags: [],
                    metadata: {
                        correlationId: context.correlationId,
                    },
                };
            });
        });
        it('should propagate correlation ID through transform pipeline', async () => {
            const correlationId = 'pipeline-test-123';
            const item = {
                id: 'test-1',
                name: 'Test Item',
                description: 'Test description',
                ingredients: [],
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId,
            };
            const verdict = await pipeline.execute(item, 'test_profile', context);
            // Verdict should include correlation ID
            expect(verdict.correlation_id).toBe(correlationId);
        });
        it('should include correlation ID in audit records', async () => {
            const correlationId = 'audit-test-456';
            const item = {
                id: 'test-2',
                name: 'Test Item',
                description: 'Test description',
                ingredients: [],
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId,
            };
            const verdict = await pipeline.execute(item, 'test_profile', context);
            // Audit ID should be generated
            expect(verdict.audit_id).toBeDefined();
            // Correlation ID should be in verdict
            expect(verdict.correlation_id).toBe(correlationId);
        });
    });
    describe('Correlation ID Format', () => {
        it('should accept UUID format correlation IDs', () => {
            const correlationId = '550e8400-e29b-41d4-a716-446655440000';
            logger.info({
                request_id: correlationId,
                tenant: 'test-tenant',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.request_id).toBe(correlationId);
        });
        it('should accept custom format correlation IDs', () => {
            const correlationId = 'custom-id-12345-abcde';
            logger.info({
                request_id: correlationId,
                tenant: 'test-tenant',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.request_id).toBe(correlationId);
        });
        it('should generate correlation ID if not provided', () => {
            logger.info({
                tenant: 'test-tenant',
                route: '/v1/menu/feed',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.request_id).toBeDefined();
            expect(typeof logEntry.request_id).toBe('string');
            expect(logEntry.request_id.length).toBeGreaterThan(0);
        });
    });
    describe('End-to-End Correlation Flow (Req 25.8)', () => {
        it('should maintain correlation ID from request to response', async () => {
            const correlationId = 'e2e-test-123';
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy({
                version: '1.0.0',
                profiles: {
                    test_profile: {
                        name: 'test_profile',
                        routes: [{
                                path: '/test',
                                transforms: ['test.transform'],
                                latency_budget_ms: 1000,
                            }],
                    },
                },
            });
            pipeline.registerTransform('test.transform', async (text, context) => {
                logger.info({
                    request_id: context.correlationId,
                    tenant: context.tenant,
                    route: '/test',
                    transform: 'test.transform',
                });
                return {
                    text,
                    modified: false,
                    flags: [],
                    metadata: {},
                };
            });
            const item = {
                id: 'e2e-1',
                name: 'Test Item',
                description: 'Test description',
                ingredients: [],
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId,
            };
            const verdict = await pipeline.execute(item, 'test_profile', context);
            expect(verdict.correlation_id).toBe(correlationId);
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.request_id).toBe(correlationId);
        });
        it('should maintain correlation ID across multiple items', async () => {
            const correlationId = 'batch-test-789';
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy({
                version: '1.0.0',
                profiles: {
                    test_profile: {
                        name: 'test_profile',
                        routes: [{
                                path: '/test',
                                transforms: ['test.transform'],
                                latency_budget_ms: 1000,
                            }],
                    },
                },
            });
            pipeline.registerTransform('test.transform', async (text, context) => {
                logger.info({
                    request_id: context.correlationId,
                    tenant: context.tenant,
                });
                return {
                    text,
                    modified: false,
                    flags: [],
                    metadata: {},
                };
            });
            const items = [
                { id: 'batch-1', name: 'Item 1', description: 'Description 1', ingredients: [] },
                { id: 'batch-2', name: 'Item 2', description: 'Description 2', ingredients: [] },
                { id: 'batch-3', name: 'Item 3', description: 'Description 3', ingredients: [] },
            ];
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId,
            };
            const verdicts = [];
            for (const item of items) {
                const verdict = await pipeline.execute(item, 'test_profile', context);
                verdicts.push(verdict);
            }
            expect(verdicts).toHaveLength(3);
            expect(verdicts[0].correlation_id).toBe(correlationId);
            expect(verdicts[1].correlation_id).toBe(correlationId);
            expect(verdicts[2].correlation_id).toBe(correlationId);
            expect(consoleLogSpy).toHaveBeenCalledTimes(3);
            const logs = consoleLogSpy.mock.calls.map((call) => JSON.parse(call[0]));
            expect(logs[0].request_id).toBe(correlationId);
            expect(logs[1].request_id).toBe(correlationId);
            expect(logs[2].request_id).toBe(correlationId);
        });
    });
});
