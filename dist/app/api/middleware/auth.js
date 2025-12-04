/**
 * Authentication Middleware
 * Bearer token authentication and tenant resolution
 * Supports both API keys and JWT tokens
 */
import { verifyToken } from '../../../packages/core/auth-service';
// Mock API key to tenant mapping (in production, this would be in database)
const API_KEY_TO_TENANT = {
    'test-key-tenant-a': 'tenant-a',
    'test-key-tenant-b': 'tenant-b',
    'test_key_tenant1': 'tenant_1',
    'test_key_tenant2': 'tenant_2',
};
/**
 * Bearer token authentication middleware
 * Validates API key and resolves tenant
 */
export function authenticateBearer(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing or invalid Authorization header',
            },
            correlation_id: req.correlationId,
        });
        return;
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    // Try to validate as JWT token first
    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
        // JWT token - attach user info
        req.tenant = jwtPayload.tenant_id;
        req.user = {
            id: jwtPayload.user_id,
            tenant_id: jwtPayload.tenant_id,
            email: jwtPayload.email,
            role: jwtPayload.role,
            password_hash: '', // Not needed in request
            mfa_enabled: false,
            created_at: '',
            updated_at: '',
        };
        next();
        return;
    }
    // Fall back to API key validation
    const tenant = API_KEY_TO_TENANT[token];
    if (!tenant) {
        res.status(401).json({
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid API key',
            },
            correlation_id: req.correlationId,
        });
        return;
    }
    // Attach tenant and API key to request
    req.tenant = tenant;
    req.apiKey = token;
    next();
}
