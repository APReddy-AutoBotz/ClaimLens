/**
 * Menu API Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import APIGateway from '../index';

describe('Menu API Routes', () => {
  let gateway: APIGateway;
  let app: any;
  const validApiKey = 'test-key-tenant-a';

  beforeAll(async () => {
    // Create new gateway instance for each test suite to avoid rate limiting
    gateway = new APIGateway();
    app = gateway.getApp();
  });

  beforeEach(() => {
    // Reset rate limiter between tests
    gateway.resetRateLimiter();
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('POST /v1/menu/feed', () => {
    it('should reject request without items field', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Missing required field: items');
    });

    it('should reject empty items array', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({ items: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Items array cannot be empty');
    });

    it('should reject items without required fields', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: [{ description: 'Missing id and name' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('must have id and name');
    });

    it('should accept single item', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: {
            id: 'item-1',
            name: 'Test Item',
            ingredients: 'flour, sugar, eggs',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verdicts');
      expect(response.body).toHaveProperty('correlation_id');
      expect(Array.isArray(response.body.verdicts)).toBe(true);
    });

    it('should accept array of items', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: [
            {
              id: 'item-1',
              name: 'Test Item 1',
              ingredients: ['flour', 'sugar'],
            },
            {
              id: 'item-2',
              name: 'Test Item 2',
              ingredients: 'milk, eggs',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.verdicts).toHaveLength(2);
      expect(response.body.verdicts[0]).toHaveProperty('verdict');
      expect(response.body.verdicts[0]).toHaveProperty('audit_id');
    });

    it('should normalize ingredients before processing', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: {
            id: 'item-1',
            name: 'Test Item',
            ingredients: 'flour, sugar, eggs', // String format
          },
        });

      expect(response.status).toBe(200);
      // Pipeline should handle normalized ingredients array
      expect(response.body.verdicts[0]).toHaveProperty('verdict');
    });

    it('should use default locale if not provided', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: {
            id: 'item-1',
            name: 'Test Item',
          },
        });

      expect(response.status).toBe(200);
      // Should default to en-IN locale
    });

    it('should accept custom locale', async () => {
      const response = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          items: {
            id: 'item-1',
            name: 'Test Item',
          },
          locale: 'en-US',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /v1/menu/validate', () => {
    it('should reject request without item field', async () => {
      const response = await request(app)
        .post('/v1/menu/validate')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Missing required field: item');
    });

    it('should reject item without required fields', async () => {
      const response = await request(app)
        .post('/v1/menu/validate')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          item: { description: 'Missing id and name' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('must have id and name');
    });

    it('should accept valid item', async () => {
      const response = await request(app)
        .post('/v1/menu/validate')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          item: {
            id: 'item-1',
            name: 'Test Item',
            ingredients: 'flour, sugar',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verdict');
      expect(response.body).toHaveProperty('audit_id');
      expect(response.body).toHaveProperty('correlation_id');
    });

    it('should normalize ingredients before processing', async () => {
      const response = await request(app)
        .post('/v1/menu/validate')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          item: {
            id: 'item-1',
            name: 'Test Item',
            ingredients: ['flour', 'sugar', 'eggs'], // Array format
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.verdict).toHaveProperty('verdict');
    });
  });

  describe('Idempotency', () => {
    it('should return same response for duplicate idempotency key', async () => {
      const idempotencyKey = 'test-idempotency-key-1';

      // First request
      const response1 = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: {
            id: 'item-1',
            name: 'Test Item',
          },
        });

      expect(response1.status).toBe(200);
      const auditId1 = response1.body.verdicts[0].audit_id;

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/v1/menu/feed')
        .set('Authorization', `Bearer ${validApiKey}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: {
            id: 'item-2', // Different item
            name: 'Different Item',
          },
        });

      expect(response2.status).toBe(200);
      const auditId2 = response2.body.verdicts[0].audit_id;

      // Should return same response (same audit_id)
      expect(auditId2).toBe(auditId1);
    });
  });
});
