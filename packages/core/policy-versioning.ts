/**
 * Policy Versioning System
 * Manages semantic versioning, diffs, and history for policy files
 */

import * as yaml from 'yaml';
import type { Pool } from 'pg';

// ============================================================================
// Semantic Version
// ============================================================================

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(versionString: string): SemanticVersion {
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semantic version: ${versionString}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function formatVersion(version: SemanticVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function incrementVersion(
  version: SemanticVersion,
  type: 'major' | 'minor' | 'patch'
): SemanticVersion {
  switch (type) {
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  }
}

// ============================================================================
// Policy Version Record
// ============================================================================

export interface PolicyVersionRecord {
  id?: number;
  version: string;
  content: string;
  created_at: Date;
  created_by: string;
  change_type: 'major' | 'minor' | 'patch';
  change_summary: string;
  diff?: string;
}

// ============================================================================
// Policy Diff
// ============================================================================

export interface PolicyDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    path: string;
    before: any;
    after: any;
  }>;
}

export function generateDiff(before: any, after: any, path: string = ''): PolicyDiff {
  const diff: PolicyDiff = {
    added: [],
    removed: [],
    modified: [],
  };

  // Handle null/undefined
  if (before === null || before === undefined) {
    if (after !== null && after !== undefined) {
      diff.added.push(path || 'root');
    }
    return diff;
  }

  if (after === null || after === undefined) {
    diff.removed.push(path || 'root');
    return diff;
  }

  // Handle primitives
  if (typeof before !== 'object' || typeof after !== 'object') {
    if (before !== after) {
      diff.modified.push({ path: path || 'root', before, after });
    }
    return diff;
  }

  // Handle arrays
  if (Array.isArray(before) && Array.isArray(after)) {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff.modified.push({ path, before, after });
    }
    return diff;
  }

  // Handle objects
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);

  // Find added keys
  for (const key of afterKeys) {
    if (!beforeKeys.includes(key)) {
      diff.added.push(path ? `${path}.${key}` : key);
    }
  }

  // Find removed keys
  for (const key of beforeKeys) {
    if (!afterKeys.includes(key)) {
      diff.removed.push(path ? `${path}.${key}` : key);
    }
  }

  // Find modified keys
  for (const key of beforeKeys) {
    if (afterKeys.includes(key)) {
      const subPath = path ? `${path}.${key}` : key;
      const subDiff = generateDiff(before[key], after[key], subPath);
      diff.added.push(...subDiff.added);
      diff.removed.push(...subDiff.removed);
      diff.modified.push(...subDiff.modified);
    }
  }

  return diff;
}

export function formatDiff(diff: PolicyDiff): string {
  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push('Added:');
    diff.added.forEach((path) => lines.push(`  + ${path}`));
  }

  if (diff.removed.length > 0) {
    lines.push('Removed:');
    diff.removed.forEach((path) => lines.push(`  - ${path}`));
  }

  if (diff.modified.length > 0) {
    lines.push('Modified:');
    diff.modified.forEach((item) => {
      lines.push(`  ~ ${item.path}`);
      lines.push(`    Before: ${JSON.stringify(item.before)}`);
      lines.push(`    After:  ${JSON.stringify(item.after)}`);
    });
  }

  return lines.join('\n');
}

// ============================================================================
// Policy Versioning Manager
// ============================================================================

export class PolicyVersioningManager {
  constructor(private pool: Pool) {}

  /**
   * Initialize version history table
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS policy_versions (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        change_type VARCHAR(10) NOT NULL,
        change_summary TEXT NOT NULL,
        diff TEXT,
        UNIQUE(version)
      );

      CREATE INDEX IF NOT EXISTS idx_policy_versions_created_at 
        ON policy_versions(created_at DESC);
    `);
  }

  /**
   * Save a new policy version
   */
  async saveVersion(record: PolicyVersionRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO policy_versions 
       (version, content, created_by, change_type, change_summary, diff)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        record.version,
        record.content,
        record.created_by,
        record.change_type,
        record.change_summary,
        record.diff || null,
      ]
    );
  }

  /**
   * Get policy version by version string
   */
  async getVersion(version: string): Promise<PolicyVersionRecord | null> {
    const result = await this.pool.query(
      `SELECT * FROM policy_versions WHERE version = $1`,
      [version]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as PolicyVersionRecord;
  }

  /**
   * Get latest policy version
   */
  async getLatestVersion(): Promise<PolicyVersionRecord | null> {
    const result = await this.pool.query(
      `SELECT * FROM policy_versions 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as PolicyVersionRecord;
  }

  /**
   * Get version history
   */
  async getVersionHistory(limit: number = 100): Promise<PolicyVersionRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM policy_versions 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows as PolicyVersionRecord[];
  }

  /**
   * Get versions within retention period (365 days minimum)
   */
  async getVersionsInRetention(retentionDays: number = 365): Promise<PolicyVersionRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM policy_versions 
       WHERE created_at >= NOW() - INTERVAL '${retentionDays} days'
       ORDER BY created_at DESC`
    );

    return result.rows as PolicyVersionRecord[];
  }

  /**
   * Parse version from policy content
   */
  parseVersionFromPolicy(policyContent: string): SemanticVersion {
    const policy = yaml.parse(policyContent);
    if (!policy.version) {
      throw new Error('Policy file missing version field');
    }
    return parseVersion(policy.version);
  }

  /**
   * Update version in policy content
   */
  updateVersionInPolicy(policyContent: string, newVersion: SemanticVersion): string {
    const policy = yaml.parse(policyContent);
    policy.version = formatVersion(newVersion);
    return yaml.stringify(policy);
  }

  /**
   * Determine change type from diff
   */
  determineChangeType(diff: PolicyDiff): 'major' | 'minor' | 'patch' {
    // Major: transforms reordered, removed, or critical changes
    const hasMajorChange = diff.modified.some(
      (item) =>
        item.path.includes('transforms') ||
        item.path.includes('routes') ||
        diff.removed.some((path) => path.includes('transforms'))
    );

    if (hasMajorChange || diff.removed.length > 0) {
      return 'major';
    }

    // Minor: new transforms added, thresholds changed
    const hasMinorChange =
      diff.added.length > 0 ||
      diff.modified.some(
        (item) =>
          item.path.includes('threshold') ||
          item.path.includes('latency_budget')
      );

    if (hasMinorChange) {
      return 'minor';
    }

    // Patch: minor config changes
    return 'patch';
  }

  /**
   * Create new version from changes
   */
  async createNewVersion(
    currentContent: string,
    newContent: string,
    userId: string,
    changeSummary: string
  ): Promise<PolicyVersionRecord> {
    // Parse current version
    const currentVersion = this.parseVersionFromPolicy(currentContent);

    // Generate diff
    const currentPolicy = yaml.parse(currentContent);
    const newPolicy = yaml.parse(newContent);
    const diff = generateDiff(currentPolicy, newPolicy);

    // Determine change type
    const changeType = this.determineChangeType(diff);

    // Increment version
    const newVersion = incrementVersion(currentVersion, changeType);

    // Update version in content
    const versionedContent = this.updateVersionInPolicy(newContent, newVersion);

    // Create version record
    const record: PolicyVersionRecord = {
      version: formatVersion(newVersion),
      content: versionedContent,
      created_at: new Date(),
      created_by: userId,
      change_type: changeType,
      change_summary: changeSummary,
      diff: formatDiff(diff),
    };

    // Save to database
    await this.saveVersion(record);

    return record;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    version1: string,
    version2: string
  ): Promise<PolicyDiff> {
    const v1 = await this.getVersion(version1);
    const v2 = await this.getVersion(version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const policy1 = yaml.parse(v1.content);
    const policy2 = yaml.parse(v2.content);

    return generateDiff(policy1, policy2);
  }
}
