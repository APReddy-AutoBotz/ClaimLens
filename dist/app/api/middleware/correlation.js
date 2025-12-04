/**
 * Correlation ID Middleware
 * Generates and propagates correlation IDs for request tracing
 */
import { randomUUID } from 'crypto';
/**
 * Correlation ID middleware
 * Generates UUID if not provided, propagates through all responses
 */
export function correlationId(req, res, next) {
    // Get correlation ID from header or generate new one
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    // Attach to request
    req.correlationId = correlationId;
    // Echo in response header
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}
