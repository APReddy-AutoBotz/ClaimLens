/**
 * Rate Limiting Middleware
 * Enforces 100 req/min per API key and 10 req/s per IP
 */
import Redis from 'ioredis';
export class RateLimiter {
    redis;
    constructor(redisUrl) {
        // Use mock in-memory store if Redis not available
        this.redis = redisUrl
            ? new Redis(redisUrl)
            : new Map(); // Fallback for testing
    }
    /**
     * Check rate limit for a given key
     */
    async checkLimit(key, limit, window) {
        // For in-memory fallback (testing)
        if (this.redis instanceof Map) {
            const now = Date.now();
            const record = this.redis.get(key) || { count: 0, resetAt: now + window * 1000 };
            if (now > record.resetAt) {
                record.count = 1;
                record.resetAt = now + window * 1000;
            }
            else {
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
    async checkBurst(ip) {
        return this.checkLimit(`burst:${ip}`, 10, 1); // 10 req/s
    }
    /**
     * Check API key rate limit (100 req/min per key)
     */
    async checkApiKey(apiKey) {
        return this.checkLimit(`api:${apiKey}`, 100, 60); // 100 req/min
    }
    /**
     * Middleware factory
     */
    middleware() {
        return async (req, res, next) => {
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
    reset() {
        if (this.redis instanceof Map) {
            this.redis.clear();
        }
    }
    /**
     * Close Redis connection
     */
    async close() {
        if (this.redis instanceof Redis) {
            await this.redis.quit();
        }
    }
}
