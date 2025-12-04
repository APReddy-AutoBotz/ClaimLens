/**
 * Consumer API Tests
 * Tests for POST /v1/consumer/scan endpoint
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { APIGateway } from '../index';
describe('POST /v1/consumer/scan', () => {
    let gateway;
    let app;
    beforeAll(async () => {
        gateway = new APIGateway();
        app = gateway.getApp();
    });
    afterAll(async () => {
        await gateway.stop();
    });
    // Reset rate limiter before each test to avoid 429 errors
    beforeEach(() => {
        gateway.resetRateLimiter();
    });
    it('should accept text input and return trust score', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
            input_data: 'Organic whole wheat bread with no preservatives',
            locale: 'en-US',
        })
            .expect(200);
        expect(response.body).toHaveProperty('trust_score');
        expect(response.body).toHaveProperty('verdict');
        expect(response.body).toHaveProperty('badges');
        expect(response.body).toHaveProperty('reasons');
        expect(response.body).toHaveProperty('correlation_id');
        expect(response.body.trust_score).toBeGreaterThanOrEqual(0);
        expect(response.body.trust_score).toBeLessThanOrEqual(110);
        expect(response.body.verdict).toHaveProperty('label');
        expect(response.body.verdict).toHaveProperty('color');
        expect(response.body.verdict).toHaveProperty('icon');
        expect(response.body.verdict).toHaveProperty('explanation');
        expect(['allow', 'caution', 'avoid']).toContain(response.body.verdict.label);
    });
    it('should accept URL input', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'url',
            input_data: 'https://example.com/product',
            locale: 'en-US',
        })
            .expect(200);
        expect(response.body).toHaveProperty('trust_score');
        expect(response.body).toHaveProperty('verdict');
    });
    it('should include allergen profile in calculation', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
            input_data: 'Contains peanuts and tree nuts',
            locale: 'en-US',
            allergen_profile: ['peanuts', 'tree nuts'],
        })
            .expect(200);
        expect(response.body).toHaveProperty('trust_score');
        expect(response.body.badges).toEqual(expect.arrayContaining([
            expect.objectContaining({
                label: 'Allergen Profile Active',
            }),
        ]));
    });
    it('should reject missing input_type', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_data: 'Some text',
        })
            .expect(400);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        expect(response.body.error.message).toContain('input_type');
    });
    it('should reject missing input_data', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
        })
            .expect(400);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        expect(response.body.error.message).toContain('input_data');
    });
    it('should reject invalid input_type', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'invalid',
            input_data: 'Some text',
        })
            .expect(400);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        expect(response.body.error.message).toContain('Invalid input_type');
    });
    it('should reject text input exceeding 10KB', async () => {
        const largeText = 'a'.repeat(11 * 1024); // 11KB
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
            input_data: largeText,
        })
            .expect(400);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        expect(response.body.error.message).toContain('10KB');
    });
    it('should reject invalid URL format', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'url',
            input_data: 'not-a-valid-url',
        })
            .expect(400);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        expect(response.body.error.message).toContain('Invalid URL');
    });
    it('should accept screenshot input', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'screenshot',
            input_data: 'base64-encoded-image-data',
        })
            .expect(200);
        expect(response.body.trust_score).toBeDefined();
        expect(response.body.verdict).toBeDefined();
    });
    it('should accept barcode input', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'barcode',
            input_data: '1234567890123',
        })
            .expect(200);
        expect(response.body.trust_score).toBeDefined();
        expect(response.body.verdict).toBeDefined();
    });
    it('should include X-Correlation-ID in response', async () => {
        const response = await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
            input_data: 'Test product',
        })
            .expect(200);
        expect(response.headers).toHaveProperty('x-correlation-id');
        expect(response.body.correlation_id).toBe(response.headers['x-correlation-id']);
    });
    it('should accept custom X-Correlation-ID header', async () => {
        const customId = 'custom-correlation-id-12345';
        const response = await request(app)
            .post('/v1/consumer/scan')
            .set('X-Correlation-ID', customId)
            .send({
            input_type: 'text',
            input_data: 'Test product',
        })
            .expect(200);
        expect(response.headers['x-correlation-id']).toBe(customId);
        expect(response.body.correlation_id).toBe(customId);
    });
    it('should complete within 2 seconds', async () => {
        const startTime = Date.now();
        await request(app)
            .post('/v1/consumer/scan')
            .send({
            input_type: 'text',
            input_data: 'Quick test product',
        })
            .expect(200);
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(2000);
    });
});
