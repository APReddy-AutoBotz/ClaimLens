/**
 * Tests for Logger
 * Requirements: 5.10, 17.1, 17.2, 17.3
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, createLogger } from '../logger';
describe('Logger', () => {
    let logger;
    let consoleLogSpy;
    beforeEach(() => {
        logger = new Logger({ enableSampling: false });
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    });
    describe('Log Structure (Req 17.1)', () => {
        it('should output JSON-formatted logs', () => {
            logger.info({
                request_id: 'test-123',
                tenant: 'test-tenant',
                route: '/test',
            });
            expect(consoleLogSpy).toHaveBeenCalledOnce();
            const logOutput = consoleLogSpy.mock.calls[0][0];
            // Should be valid JSON
            expect(() => JSON.parse(logOutput)).not.toThrow();
            const logEntry = JSON.parse(logOutput);
            expect(typeof logEntry).toBe('object');
        });
        it('should include all required structured fields', () => {
            logger.info({
                request_id: 'test-123',
                tenant: 'test-tenant',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                transform: 'redact.pii',
                decision: 'modify',
                reason: 'PII detected',
                duration_ms: 15,
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            // Required fields per Req 5.10
            expect(logEntry).toHaveProperty('ts');
            expect(logEntry).toHaveProperty('level');
            expect(logEntry).toHaveProperty('request_id');
            expect(logEntry).toHaveProperty('tenant');
            expect(logEntry).toHaveProperty('profile');
            expect(logEntry).toHaveProperty('route');
            expect(logEntry).toHaveProperty('transform');
            expect(logEntry).toHaveProperty('decision');
            expect(logEntry).toHaveProperty('reason');
            expect(logEntry).toHaveProperty('duration_ms');
            // Verify values
            expect(logEntry.request_id).toBe('test-123');
            expect(logEntry.tenant).toBe('test-tenant');
            expect(logEntry.profile).toBe('menushield_in');
            expect(logEntry.route).toBe('/v1/menu/feed');
            expect(logEntry.transform).toBe('redact.pii');
            expect(logEntry.decision).toBe('modify');
            expect(logEntry.duration_ms).toBe(15);
        });
        it('should include ISO 8601 timestamp', () => {
            logger.info({ request_id: 'test-123' });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            // Should be valid date
            const date = new Date(logEntry.ts);
            expect(date.toString()).not.toBe('Invalid Date');
        });
        it('should support all log levels', () => {
            // Create logger with debug level enabled
            const debugLogger = new Logger({ minLevel: 'debug', enableSampling: false });
            const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            debugLogger.debug({ request_id: 'test-1' });
            debugLogger.info({ request_id: 'test-2' });
            debugLogger.warn({ request_id: 'test-3' });
            debugLogger.error({ request_id: 'test-4' });
            expect(debugSpy).toHaveBeenCalledTimes(4);
            const levels = debugSpy.mock.calls.map((call) => JSON.parse(call[0]).level);
            expect(levels).toEqual(['debug', 'info', 'warn', 'error']);
            debugSpy.mockRestore();
        });
        it('should include error details when logging errors', () => {
            logger.error({
                request_id: 'test-123',
                error: {
                    code: 'TRANSFORM_ERROR',
                    message: 'Transform failed',
                    stack: 'Error: Transform failed\n  at ...',
                },
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.error).toBeDefined();
            expect(logEntry.error.code).toBe('TRANSFORM_ERROR');
            expect(logEntry.error.message).toBe('Transform failed');
            expect(logEntry.error.stack).toContain('Error: Transform failed');
        });
    });
    describe('PII Redaction (Req 17.2)', () => {
        it('should redact email addresses from reason field', () => {
            logger.info({
                request_id: 'test-123',
                reason: 'Contact user@example.com for details',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.reason).toBe('Contact [EMAIL_REDACTED] for details');
            expect(logEntry.reason).not.toContain('user@example.com');
        });
        it('should redact phone numbers from reason field', () => {
            logger.info({
                request_id: 'test-123',
                reason: 'Call +91 9876543210 or 9123456789',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.reason).toContain('[PHONE_REDACTED]');
            expect(logEntry.reason).not.toContain('9876543210');
            expect(logEntry.reason).not.toContain('9123456789');
        });
        it('should redact pincodes with context words', () => {
            logger.info({
                request_id: 'test-123',
                reason: 'Delivery to pincode 560001 failed',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.reason).toContain('[PINCODE_REDACTED]');
            expect(logEntry.reason).not.toContain('560001');
        });
        it('should redact PII from metadata objects', () => {
            logger.info({
                request_id: 'test-123',
                metadata: {
                    user: 'test@example.com',
                    phone: '+91 9876543210',
                    address: 'pin code: 560001',
                },
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.metadata.user).toBe('[EMAIL_REDACTED]');
            expect(logEntry.metadata.phone).toContain('[PHONE_REDACTED]');
            expect(logEntry.metadata.address).toContain('[PINCODE_REDACTED]');
        });
        it('should redact PII from nested metadata', () => {
            logger.info({
                request_id: 'test-123',
                metadata: {
                    details: {
                        contact: 'user@example.com',
                        nested: {
                            phone: '9876543210',
                        },
                    },
                },
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.metadata.details.contact).toBe('[EMAIL_REDACTED]');
            expect(logEntry.metadata.details.nested.phone).toContain('[PHONE_REDACTED]');
        });
        it('should redact PII from error messages', () => {
            logger.error({
                request_id: 'test-123',
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid email: user@example.com',
                },
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.error.message).toContain('[EMAIL_REDACTED]');
            expect(logEntry.error.message).not.toContain('user@example.com');
        });
        it('should not redact PII when disabled', () => {
            const noPIILogger = new Logger({
                enableSampling: false,
                redactPII: false
            });
            noPIILogger.info({
                request_id: 'test-123',
                reason: 'Contact user@example.com',
            });
            const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
            expect(logEntry.reason).toBe('Contact user@example.com');
        });
    });
    describe('Log Sampling (Req 5.9)', () => {
        it('should log all requests below sampling threshold', () => {
            const samplingLogger = new Logger({
                enableSampling: true,
                samplingThreshold: 1000,
                samplingRate: 0.1,
            });
            consoleLogSpy.mockClear();
            // Log 50 requests (below threshold)
            for (let i = 0; i < 50; i++) {
                samplingLogger.info({ request_id: `test-${i}` });
            }
            // Should log all requests
            expect(consoleLogSpy.mock.calls.length).toBe(50);
        });
        it('should apply sampling at high QPS (>1000 req/s)', () => {
            const samplingLogger = new Logger({
                enableSampling: true,
                samplingThreshold: 10, // Lower threshold for testing
                samplingRate: 0.1, // 10% sampling
            });
            consoleLogSpy.mockClear();
            // Simulate high QPS (>10 req/s)
            for (let i = 0; i < 100; i++) {
                samplingLogger.info({ request_id: `test-${i}` });
            }
            // Should log approximately 10% (with some variance)
            const logCount = consoleLogSpy.mock.calls.length;
            expect(logCount).toBeLessThan(100);
            expect(logCount).toBeGreaterThan(0);
        });
        it('should not sample when sampling is disabled', () => {
            const noSamplingLogger = new Logger({
                enableSampling: false,
            });
            consoleLogSpy.mockClear();
            for (let i = 0; i < 100; i++) {
                noSamplingLogger.info({ request_id: `test-${i}` });
            }
            expect(consoleLogSpy.mock.calls.length).toBe(100);
        });
    });
    describe('Log Level Filtering', () => {
        it('should respect minimum log level', () => {
            const warnLogger = new Logger({
                minLevel: 'warn',
                enableSampling: false
            });
            consoleLogSpy.mockClear();
            warnLogger.debug({ request_id: 'test-1' });
            warnLogger.info({ request_id: 'test-2' });
            warnLogger.warn({ request_id: 'test-3' });
            warnLogger.error({ request_id: 'test-4' });
            // Should only log warn and error
            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            const levels = consoleLogSpy.mock.calls.map((call) => JSON.parse(call[0]).level);
            expect(levels).toEqual(['warn', 'error']);
        });
    });
    describe('Configuration Management', () => {
        it('should allow configuration updates', () => {
            logger.updateConfig({ minLevel: 'error' });
            consoleLogSpy.mockClear();
            logger.info({ request_id: 'test-1' });
            logger.error({ request_id: 'test-2' });
            // Should only log error
            expect(consoleLogSpy).toHaveBeenCalledOnce();
        });
        it('should return current configuration', () => {
            const config = logger.getConfig();
            expect(config).toHaveProperty('minLevel');
            expect(config).toHaveProperty('enableSampling');
            expect(config).toHaveProperty('samplingThreshold');
            expect(config).toHaveProperty('samplingRate');
            expect(config).toHaveProperty('redactPII');
        });
    });
    describe('Logger Factory', () => {
        it('should create logger with custom configuration', () => {
            const customLogger = createLogger({
                minLevel: 'warn',
                enableSampling: false,
                redactPII: true,
            });
            consoleLogSpy.mockClear();
            customLogger.info({ request_id: 'test-1' });
            customLogger.warn({ request_id: 'test-2' });
            // Should only log warn (info filtered out)
            expect(consoleLogSpy).toHaveBeenCalledOnce();
        });
    });
});
