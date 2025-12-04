/**
 * Rate Limiting Middleware
 * Enforces 100 req/min per API key and 10 req/s per IP
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

export interface RateLimitedRequest extends Request {
  apiKey?: string;
  correlationId: string;
}

export class RateLimiter {
  private redis: Redis;

  constructor(redisUrl?: string) {
    // Use mock in-memory store if Redis not available
    this.redis = redisUrl
      ? new Redis(redisUrl)
      : (new Map() as any); // Fallback for testing
  }

  /**
   * Check rate limit for a given key
   */
  private async checkLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    // For in-memory fallback (testing)
    if (this.redis instanceof Map) {
      const now = Date.now();
      const record = (this.redis.get(key) as any) || { count: 0, resetAt: now + window * 1000 };
      
      if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + window * 1000;
      } else {
        record.count++;
      }
      
      this.redis.set(key, record);
      
      if (record.count > limit) {
        return {
          allowed: false,
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        };
      }
      
      return { allowed: true };
    }

    // Redis implementation
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, window);
    }

    if (count > limit) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        retryAfter: ttl > 0 ? ttl : window,
      };
    }

    return { allowed: true };
  }

  /**
   * Check burst rate limit (10 req/s per IP)
   */
  async checkBurst(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    return this.checkLimit(`burst:${ip}`, 10, 1); // 10 req/s
  }

  /**
   * Check API key rate limit (100 req/min per key)
   */
  async checkApiKey(apiKey: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    return this.checkLimit(`api:${apiKey}`, 100, 60); // 100 req/min
  }

  /**
   * Middleware factory
   */
  middleware() {
    return async (
      req: RateLimitedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      // Check IP burst limit
      const burstCheck = await this.checkBurst(ip);
      if (!burstCheck.allowed) {
        res.status(429)
          .setHeader('Retry-After', burstCheck.retryAfter?.toString() || '1')
          .json({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests from this IP. Please slow down.',
            },
            correlation_id: req.correlationId,
          });
        return;
      }

      // Check API key limit (if authenticated)
      if (req.apiKey) {
        const apiKeyCheck = await this.checkApiKey(req.apiKey);
        if (!apiKeyCheck.allowed) {
          res.status(429)
            .setHeader('Retry-After', apiKeyCheck.retryAfter?.toString() || '60')
            .json({
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'API key rate limit exceeded. Please wait before retrying.',
              },
              correlation_id: req.correlationId,
            });
          return;
        }
      }

      next();
    };
  }

  /**
   * Reset rate limits (for testing)
   */
  reset(): void {
    if (this.redis instanceof Map) {
      this.redis.clear();
    }
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
