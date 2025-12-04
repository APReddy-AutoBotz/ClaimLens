/**
 * Input Validation Middleware
 * Sanitizes and validates all incoming request data
 * Requirements: 18.1, 18.2
 */

import { Request, Response, NextFunction } from 'express';
import {
  sanitizeText,
  validateInputLength,
  sanitizeMenuItem,
} from '../../../packages/core/input-sanitizer';

export interface ValidatedRequest extends Request {
  correlationId: string;
}

/**
 * Validate request payload size
 * Rejects requests exceeding 1MB
 */
export function validatePayloadSize(
  req: ValidatedRequest,
  res: Response,
  next: NextFunction
): void {
  const contentLength = req.headers['content-length'];
  
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    res.status(400).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum size of 1MB',
      },
      correlation_id: req.correlationId,
    });
    return;
  }
  
  next();
}

/**
 * Sanitize request body
 * Applies text sanitization to all string fields
 */
export function sanitizeRequestBody(
  req: ValidatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.body || typeof req.body !== 'object') {
    next();
    return;
  }

  try {
    // Validate input lengths
    const lengthCheck = validateInputLength(req.body);
    if (!lengthCheck.valid) {
      res.status(400).json({
        error: {
          code: 'INPUT_TOO_LONG',
          message: lengthCheck.error,
        },
        correlation_id: req.correlationId,
      });
      return;
    }

    // Sanitize based on content type
    if (req.body.items && Array.isArray(req.body.items)) {
      // Menu items array
      req.body.items = req.body.items.map((item: any) => sanitizeMenuItem(item));
    } else if (req.body.id && req.body.name) {
      // Single menu item
      req.body = sanitizeMenuItem(req.body);
    } else {
      // Generic object - sanitize all string fields
      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Failed to sanitize request data',
      },
      correlation_id: req.correlationId,
    });
  }
}

/**
 * Recursively sanitize object fields
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
