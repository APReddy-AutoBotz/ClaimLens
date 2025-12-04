/**
 * RBAC Middleware
 * Role-based access control enforcement at API gateway level
 */
import { checkPermission, Role } from '../../../packages/core/tenant-models';
/**
 * Middleware to check if user has permission for a resource and action
 */
export function requirePermission(resource, action) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                correlation_id: req.correlationId,
            });
            return;
        }
        if (!checkPermission(req.user, resource, action)) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Insufficient permissions: ${action} on ${resource}`,
                },
                correlation_id: req.correlationId,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware to check if user has one of the specified roles
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                correlation_id: req.correlationId,
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Required role: ${roles.join(' or ')}`,
                },
                correlation_id: req.correlationId,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware to require admin role
 */
export function requireAdmin(req, res, next) {
    return requireRole(Role.ADMIN)(req, res, next);
}
