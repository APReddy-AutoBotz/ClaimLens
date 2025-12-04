/**
 * API Gateway Integration Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import APIGateway from '../index';
describe('API Gateway Integration', () => {
    let gateway;
    let app;
    beforeAll(async () => {
        gateway = new APIGateway();
        app = gateway.getApp();
    });
    afterAll(async () => {
        await gateway.stop();
    });
    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
    describe('Correlation ID', () => {
        it('should generate correlation ID if not provided', async () => {
            const response = await request(app).get('/health');
            expect(response.headers).toHaveProperty('x-correlation-id');
            expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });
        it('should propagate provided correlation ID', async () => {
            const correlationId = '12345678-1234-1234-1234-123456789012';
            const response = await request(app)
                .get('/health')
                .set('X-Correlation-ID', correlationId);
            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });
    });
    describe('Authentication', () => {
        it('should reject requests without Authorization header', async () => {
            const response = await request(app)
                .post('/v1/menu/feed')
                .send({ items: [] });
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
            expect(response.body).toHaveProperty('correlation_id');
        });
        it('should reject requests with invalid Bearer token', async () => {
            const response = await request(app)
                .post('/v1/menu/feed')
                .set('Authorization', 'Bearer invalid-key')
                .send({ items: [] });
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('INVALID_API_KEY');
        });
        it('should accept requests with valid Bearer token', async () => {
            const response = await request(app)
                .post('/v1/menu/feed')
                .set('Authorization', 'Bearer test-key-tenant-a')
                .send({ items: [] });
            // Should pass auth but fail validation (empty items)
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('BAD_REQUEST');
        });
    });
    describe('Error Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/unknown-route');
            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe('NOT_FOUND');
            expect(response.body).toHaveProperty('correlation_id');
        });
        it('should return 400 for invalid JSON', async () => {
            const response = await request(app)
                .post('/v1/menu/feed')
                .set('Authorization', 'Bearer test-key-tenant-a')
                .set('Content-Type', 'application/json')
                .send('invalid json{');
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_JSON');
        });
        it('should include correlation ID in all error responses', async () => {
            const response = await request(app)
                .get('/unknown-route')
                .set('X-Correlation-ID', 'test-correlation-id');
            expect(response.body.correlation_id).toBe('test-correlation-id');
        });
    });
    describe('Rate Limiting', () => {
        it('should enforce IP burst rate limit', async () => {
            // Make 11 requests rapidly (limit is 10 req/s)
            const requests = Array.from({ length: 11 }, () => request(app).get('/health'));
            const responses = await Promise.all(requests);
            const rateLimited = responses.filter((r) => r.status === 429);
            // At least one should be rate limited
            expect(rateLimited.length).toBeGreaterThan(0);
            expect(rateLimited[0].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(rateLimited[0].headers).toHaveProperty('retry-after');
        });
    });
});
