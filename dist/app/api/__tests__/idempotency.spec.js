/**
 * Idempotency Manager Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { IdempotencyManager } from '../middleware/idempotency';
describe('IdempotencyManager', () => {
    let manager;
    beforeEach(() => {
        // Use in-memory fallback for testing
        manager = new IdempotencyManager();
    });
    it('should return null for non-existent idempotency key', async () => {
        const result = await manager.checkIdempotency('non-existent-key');
        expect(result).toBeNull();
    });
    it('should store and retrieve response for idempotency key', async () => {
        const key = 'test-key-1';
        const response = { verdict: 'allow', audit_id: '123' };
        await manager.storeResponse(key, response);
        const cached = await manager.checkIdempotency(key);
        expect(cached).toEqual(response);
    });
    it('should handle request without idempotency key', async () => {
        let handlerCalled = false;
        const handler = async () => {
            handlerCalled = true;
            return { result: 'success' };
        };
        const result = await manager.handleRequest(undefined, handler);
        expect(handlerCalled).toBe(true);
        expect(result).toEqual({ result: 'success' });
    });
    it('should execute handler on first request with idempotency key', async () => {
        const key = 'test-key-2';
        let handlerCallCount = 0;
        const handler = async () => {
            handlerCallCount++;
            return { result: 'success', call: handlerCallCount };
        };
        const result = await manager.handleRequest(key, handler);
        expect(handlerCallCount).toBe(1);
        expect(result).toEqual({ result: 'success', call: 1 });
    });
    it('should return cached response on duplicate request', async () => {
        const key = 'test-key-3';
        let handlerCallCount = 0;
        const handler = async () => {
            handlerCallCount++;
            return { result: 'success', call: handlerCallCount };
        };
        // First request
        const result1 = await manager.handleRequest(key, handler);
        expect(handlerCallCount).toBe(1);
        expect(result1).toEqual({ result: 'success', call: 1 });
        // Second request with same key
        const result2 = await manager.handleRequest(key, handler);
        expect(handlerCallCount).toBe(1); // Handler not called again
        expect(result2).toEqual({ result: 'success', call: 1 }); // Same response
    });
    it('should handle multiple different idempotency keys', async () => {
        const key1 = 'test-key-4';
        const key2 = 'test-key-5';
        await manager.storeResponse(key1, { id: 1 });
        await manager.storeResponse(key2, { id: 2 });
        const cached1 = await manager.checkIdempotency(key1);
        const cached2 = await manager.checkIdempotency(key2);
        expect(cached1).toEqual({ id: 1 });
        expect(cached2).toEqual({ id: 2 });
    });
});
