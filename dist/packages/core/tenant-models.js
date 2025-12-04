/**
 * Tenant and User Models
 * Data models for multi-tenancy and RBAC
 */
// ============================================================================
// Role and Permission Types
// ============================================================================
export var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["EDITOR"] = "editor";
    Role["VIEWER"] = "viewer";
})(Role || (Role = {}));
export const ROLE_PERMISSIONS = {
    [Role.ADMIN]: [
        { resource: '*', actions: ['*'] },
    ],
    [Role.EDITOR]: [
        { resource: 'policies', actions: ['read', 'write'] },
        { resource: 'rule_packs', actions: ['read', 'write'] },
        { resource: 'audits', actions: ['read'] },
        { resource: 'fixtures', actions: ['read', 'execute'] },
        { resource: 'webhooks', actions: ['read', 'write'] },
    ],
    [Role.VIEWER]: [
        { resource: '*', actions: ['read'] },
    ],
};
// ============================================================================
// Permission Check Function
// ============================================================================
/**
 * Check if a user has permission to perform an action on a resource
 */
export function checkPermission(user, resource, action) {
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.some(p => (p.resource === '*' || p.resource === resource) &&
        (p.actions.includes('*') || p.actions.includes(action)));
}
/**
 * Check if a user has any of the specified roles
 */
export function hasRole(user, ...roles) {
    return roles.includes(user.role);
}
/**
 * Check if a user is an admin
 */
export function isAdmin(user) {
    return user.role === Role.ADMIN;
}
