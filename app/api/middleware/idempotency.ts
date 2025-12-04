/**
 * Idempotency Manager
 * Handles idempotency keys with 24-hour TTL and response caching
 */

import Redis from 'ioredis';

export interface IdempotencyRecord {
  key: string;
  response: any;
  created_at: Date;
  ttl: number;
}

export class IdempotencyManager {
  private redis: Redis;
  private TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(redisUrl?: string) {
    // Use mock in-memory store if Redis not available
    this.redis = redisUrl
      ? new Redis(redisUrl)
      : (new Map() as any); // Fallback for testing
  }

  /**
   * Check if idempotency key exists and return cached response
   */
  async checkIdempotency(key: string): Promise<any | null> {
    // For in-memory fallback (testing)
    if (this.redis instanceof Map) {
      const record = this.redis.get(`idempotency:${key}`) as any;
      if (record && Date.now() < record.expiresAt) {
        return record.response;
      }
      return null;
    }

    // Redis implementation
    const cached = await this.redis.get(`idempotency:${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Store response for idempotency key with 24-hour TTL
   */
  async storeResponse(key: string, response: any): Promise<void> {
    // For in-memory fallback (testing)
    if (this.redis instanceof Map) {
      this.redis.set(`idempotency:${key}`, {
        response,
        expiresAt: Date.now() + this.TTL * 1000,
      });
      return;
    }

    // Redis implementation
    await this.redis.setex(
      `idempotency:${key}`,
      this.TTL,
      JSON.stringify(response)
    );
  }

  /**
   * Handle request with idempotency key
   * Returns cached response if key exists, otherwise executes handler
   */
  async handleRequest(
    key: string | undefined,
    handler: () => Promise<any>
  ): Promise<any> {
    if (!key) {
      // No idempotency key, process normally
      return await handler();
    }

    // Check for existing response
    const cached = await this.checkIdempotency(key);
    if (cached) {
      return cached;
    }

    // Process request
    const response = await handler();

    // Store for future requests
    await this.storeResponse(key, response);

    return response;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis instanceof Redis) {
      await this.redis.quit();
    }
  }
}
