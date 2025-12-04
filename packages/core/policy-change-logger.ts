/**
 * Policy Change Logger
 * Logs all configuration changes with user, timestamp, delta, and Augment-Lite 4C fields
 */

import type { Pool } from 'pg';
import { PolicyChangeLog, User } from './tenant-models';

export interface AugmentLiteFields {
  context: string;
  constraints: string;
  selfCritique: string;
}

export interface PolicyChange {
  action: string;
  before: any;
  after: any;
  augmentLite?: AugmentLiteFields;
}

export class PolicyChangeLogger {
  constructor(private pool: Pool) {}

  /**
   * Log a policy change with full audit trail
   */
  async logChange(
    user: User,
    change: PolicyChange
  ): Promise<PolicyChangeLog> {
    const diff = this.generateDiff(change.before, change.after);
    const version = this.incrementVersion(change.before?.version || '0.0.0');

    const result = await this.pool.query(
      `INSERT INTO policy_change_log (
        tenant, user_id, user_email, action,
        before_value, after_value, diff,
        context, constraints, self_critique, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        user.tenant_id,
        user.id,
        user.email,
        change.action,
        JSON.stringify(change.before),
        JSON.stringify(change.after),
        diff,
        change.augmentLite?.context,
        change.augmentLite?.constraints,
        change.augmentLite?.selfCritique,
        version,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get change history for a tenant
   */
  async getChangeHistory(
    tenant: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PolicyChangeLog[]> {
    const result = await this.pool.query(
      `SELECT * FROM policy_change_log
       WHERE tenant = $1
       ORDER BY ts DESC
       LIMIT $2 OFFSET $3`,
      [tenant, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get changes by user
   */
  async getChangesByUser(
    userId: string,
    limit: number = 100
  ): Promise<PolicyChangeLog[]> {
    const result = await this.pool.query(
      `SELECT * FROM policy_change_log
       WHERE user_id = $1
       ORDER BY ts DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Get changes by action type
   */
  async getChangesByAction(
    tenant: string,
    action: string,
    limit: number = 100
  ): Promise<PolicyChangeLog[]> {
    const result = await this.pool.query(
      `SELECT * FROM policy_change_log
       WHERE tenant = $1 AND action = $2
       ORDER BY ts DESC
       LIMIT $3`,
      [tenant, action, limit]
    );

    return result.rows;
  }

  /**
   * Export change history as CSV
   */
  async exportToCSV(tenant: string): Promise<string> {
    const changes = await this.getChangeHistory(tenant, 10000);

    const headers = [
      'Timestamp',
      'User Email',
      'Action',
      'Version',
      'Context',
      'Constraints',
      'Self-Critique',
      'Diff',
    ];

    const rows = changes.map(change => [
      change.ts,
      change.user_email,
      change.action,
      change.version,
      change.context || '',
      change.constraints || '',
      change.self_critique || '',
      change.diff || '',
    ]);

    // CSV formatting
    const csvRows = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );

    return csvRows.join('\n');
  }

  /**
   * Generate a human-readable diff between before and after values
   */
  private generateDiff(before: any, after: any): string {
    if (!before || !after) {
      return 'New configuration';
    }

    const changes: string[] = [];

    // Compare objects recursively
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

      for (const key of keys) {
        const fullPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        if (val1 === undefined && val2 !== undefined) {
          changes.push(`+ ${fullPath}: ${JSON.stringify(val2)}`);
        } else if (val1 !== undefined && val2 === undefined) {
          changes.push(`- ${fullPath}: ${JSON.stringify(val1)}`);
        } else if (typeof val1 === 'object' && typeof val2 === 'object') {
          compareObjects(val1, val2, fullPath);
        } else if (val1 !== val2) {
          changes.push(`~ ${fullPath}: ${JSON.stringify(val1)} → ${JSON.stringify(val2)}`);
        }
      }
    };

    compareObjects(before, after);

    return changes.length > 0 ? changes.join('\n') : 'No changes detected';
  }

  /**
   * Increment semantic version (MAJOR.MINOR.PATCH)
   */
  private incrementVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    // Increment patch version by default
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Increment major version (breaking changes)
   */
  incrementMajorVersion(currentVersion: string): string {
    const [major] = currentVersion.split('.').map(Number);
    return `${major + 1}.0.0`;
  }

  /**
   * Increment minor version (new features)
   */
  incrementMinorVersion(currentVersion: string): string {
    const [major, minor] = currentVersion.split('.').map(Number);
    return `${major}.${minor + 1}.0`;
  }
}

/**
 * Validate Augment-Lite 4C fields
 */
export function validateAugmentLiteFields(fields: AugmentLiteFields): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const MIN_LENGTH = 20;

  if (!fields.context || fields.context.length < MIN_LENGTH) {
    errors.push(`Context must be at least ${MIN_LENGTH} characters`);
  }

  if (!fields.constraints || fields.constraints.length < MIN_LENGTH) {
    errors.push(`Constraints must be at least ${MIN_LENGTH} characters`);
  }

  if (!fields.selfCritique || fields.selfCritique.length < MIN_LENGTH) {
    errors.push(`Self-critique must be at least ${MIN_LENGTH} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
