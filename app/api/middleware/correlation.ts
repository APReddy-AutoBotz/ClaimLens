/**
 * Correlation ID Middleware
 * Generates and propagates correlation IDs for request tracing
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CorrelatedRequest extends Request {
  correlationId: string;
}

/**
 * Correlation ID middleware
 * Generates UUID if not provided, propagates through all responses
 */
export function correlationId(
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID from header or generate new one
  const correlationId =
    (req.headers['x-correlation-id'] as string) || randomUUID();

  // Attach to request
  req.correlationId = correlationId;

  // Echo in response header
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}
