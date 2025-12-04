/**
 * Tenant and User Models
 * Data models for multi-tenancy and RBAC
 */

// ============================================================================
// Role and Permission Types
// ============================================================================

export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface Permission {
  resource: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
// Tenant Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TenantConfig {
  tenant: string;
  retention_days: number;
  webhook_url?: string;
  webhook_secret?: string;
  allowed_locales: string[];
  custom_rule_packs?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: Role;
  mfa_enabled: boolean;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_activity_at: string;
}

// ============================================================================
// API Key Types
// ============================================================================

export interface ApiKey {
  id: number;
  tenant: string;
  key_hash: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

// ============================================================================
// Policy Change Log Types
// ============================================================================

export interface PolicyChangeLog {
  id: number;
  ts: string;
  tenant: string;
  user_id: string;
  user_email: string;
  action: string;
  before_value?: any;
  after_value?: any;
  diff?: string;
  context?: string;
  constraints?: string;
  self_critique?: string;
  version: string;
}

// ============================================================================
// Permission Check Function
// ============================================================================

/**
 * Check if a user has permission to perform an action on a resource
 */
export function checkPermission(
  user: User,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  
  return permissions.some(p =>
    (p.resource === '*' || p.resource === resource) &&
    (p.actions.includes('*') || p.actions.includes(action))
  );
}

/**
 * Check if a user has any of the specified roles
 */
export function hasRole(user: User, ...roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: User): boolean {
  return user.role === Role.ADMIN;
}
