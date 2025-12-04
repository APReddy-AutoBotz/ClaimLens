/**
 * Error Handling Middleware
 * Standardized error responses with correlation IDs
 */
/**
 * Custom application error class
 */
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
/**
 * Error handler middleware
 * Catches all errors and returns standardized responses
 */
export function errorHandler(err, req, res, next) {
    // Default to 500 Internal Server Error
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details;
    // Handle known AppError instances
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    }
    else if (err.name === 'ValidationError') {
        // JSON schema validation errors
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Request validation failed';
        details = { error: err.message };
    }
    else if (err.name === 'SyntaxError') {
        // JSON parsing errors
        statusCode = 400;
        code = 'INVALID_JSON';
        message = 'Invalid JSON in request body';
    }
    // Never expose internal details in 5xx errors
    if (statusCode >= 500) {
        message = 'An unexpected error occurred';
        details = undefined;
        // Log full error for debugging
        console.error('Internal error:', {
            ts: new Date().toISOString(),
            correlation_id: req.correlationId,
            error: err.message,
            stack: err.stack,
        });
    }
    const errorResponse = {
        error: {
            code,
            message,
            ...(details && { details }),
        },
        correlation_id: req.correlationId,
    };
    res.status(statusCode).json(errorResponse);
}
/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
        },
        correlation_id: req.correlationId,
    });
}
/**
 * Helper to create common errors
 */
export const Errors = {
    badRequest: (message, details) => new AppError(400, 'BAD_REQUEST', message, details),
    unauthorized: (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message),
    forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
    notFound: (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message),
    rateLimitExceeded: (retryAfter) => new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests', {
        retry_after: retryAfter,
    }),
    internalError: (message = 'Internal server error') => new AppError(500, 'INTERNAL_SERVER_ERROR', message),
    serviceUnavailable: (message = 'Service temporarily unavailable') => new AppError(503, 'SERVICE_UNAVAILABLE', message),
    notImplemented: (message = 'Feature not yet implemented') => new AppError(501, 'NOT_IMPLEMENTED', message),
};
