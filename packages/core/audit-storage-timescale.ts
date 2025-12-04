/**
 * TimescaleDB Audit Storage Backend
 * Time-series storage with automatic partitioning and retention policies
 */

import type { AuditRecord } from './types.js';
import type { AuditStorageBackend, AuditQueryFilters } from './audit-manager.js';

export interface TimescaleDBConfig {
  connectionString: string;
  tableName?: string;
  retentionDays?: number;
  autoCreatePartitions?: boolean;
}

/**
 * TimescaleDB Storage Backend
 * 
 * Features:
 * - Automatic monthly partitioning
 * - Configurable retention policies (90-365 days)
 * - Optimized indexes for common queries
 * - Cursor-based pagination support
 */
export class TimescaleAuditStorage implements AuditStorageBackend {
  private config: TimescaleDBConfig;
  private db: any; // PostgreSQL client (pg or similar)
  private tableName: string;

  constructor(config: TimescaleDBConfig) {
    this.config = config;
    this.tableName = config.tableName || 'audit_records';
  }

  /**
   * Initialize database connection and schema
   */
  async initialize(dbClient: any): Promise<void> {
    this.db = dbClient;
    await this.createSchema();
    await this.createIndexes();
    
    if (this.config.autoCreatePartitions !== false) {
      await this.setupPartitioning();
    }
    
    if (this.config.retentionDays) {
      await this.setupRetentionPolicy(this.config.retentionDays);
    }
  }

  /**
   * Create audit records table schema
   */
  private async createSchema(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        audit_id TEXT PRIMARY KEY,
        ts TIMESTAMPTZ NOT NULL,
        tenant TEXT NOT NULL,
        profile TEXT NOT NULL,
        route TEXT NOT NULL,
        item_id TEXT NOT NULL,
        transforms JSONB NOT NULL,
        verdict JSONB NOT NULL,
        latency_ms NUMERIC NOT NULL,
        degraded_mode BOOLEAN NOT NULL DEFAULT false,
        degraded_services TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await this.db.query(createTableSQL);

    // Convert to hypertable for time-series optimization
    const hypertableSQL = `
      SELECT create_hypertable(
        '${this.tableName}',
        'ts',
        if_not_exists => TRUE,
        chunk_time_interval => INTERVAL '1 month'
      );
    `;

    try {
      await this.db.query(hypertableSQL);
    } catch (error) {
      // Table might already be a hypertable
      console.warn('Could not create hypertable:', error);
    }
  }

  /**
   * Create indexes for common query patterns
   */
  private async createIndexes(): Promise<void> {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_tenant_ts 
       ON ${this.tableName} (tenant, ts DESC)`,
      
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_correlation 
       ON ${this.tableName} ((verdict->>'correlation_id'))`,
      
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_item 
       ON ${this.tableName} (item_id)`,
      
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_tenant_item 
       ON ${this.tableName} (tenant, item_id, ts DESC)`
    ];

    for (const indexSQL of indexes) {
      try {
        await this.db.query(indexSQL);
      } catch (error) {
        console.warn('Could not create index:', error);
      }
    }
  }

  /**
   * Setup automatic partitioning
   */
  private async setupPartitioning(): Promise<void> {
    // TimescaleDB handles partitioning automatically via hypertables
    // This method can be used for additional partition management if needed
  }

  /**
   * Setup retention policy
   */
  private async setupRetentionPolicy(retentionDays: number): Promise<void> {
    const retentionSQL = `
      SELECT add_retention_policy(
        '${this.tableName}',
        INTERVAL '${retentionDays} days',
        if_not_exists => TRUE
      );
    `;

    try {
      await this.db.query(retentionSQL);
    } catch (error) {
      console.warn('Could not set retention policy:', error);
    }
  }

  /**
   * Save an audit record
   */
  async save(record: AuditRecord): Promise<void> {
    const insertSQL = `
      INSERT INTO ${this.tableName} (
        audit_id, ts, tenant, profile, route, item_id,
        transforms, verdict, latency_ms, degraded_mode, degraded_services
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (audit_id) DO NOTHING
    `;

    const values = [
      record.audit_id,
      record.ts,
      record.tenant,
      record.profile,
      record.route,
      record.item_id,
      JSON.stringify(record.transforms),
      JSON.stringify(record.verdict),
      record.latency_ms,
      record.degraded_mode,
      record.degraded_services || null
    ];

    await this.db.query(insertSQL, values);
  }

  /**
   * Get an audit record by ID
   */
  async get(auditId: string): Promise<AuditRecord | null> {
    const selectSQL = `
      SELECT * FROM ${this.tableName}
      WHERE audit_id = $1
    `;

    const result = await this.db.query(selectSQL, [auditId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToRecord(result.rows[0]);
  }

  /**
   * Query audit records with filters
   */
  async query(filters: AuditQueryFilters): Promise<AuditRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (filters.tenant) {
      conditions.push(`tenant = $${paramIndex++}`);
      values.push(filters.tenant);
    }

    if (filters.itemId) {
      conditions.push(`item_id = $${paramIndex++}`);
      values.push(filters.itemId);
    }

    if (filters.correlationId) {
      conditions.push(`verdict->>'correlation_id' = $${paramIndex++}`);
      values.push(filters.correlationId);
    }

    if (filters.startDate) {
      conditions.push(`ts >= $${paramIndex++}`);
      values.push(filters.startDate.toISOString());
    }

    if (filters.endDate) {
      conditions.push(`ts <= $${paramIndex++}`);
      values.push(filters.endDate.toISOString());
    }

    // Handle cursor-based pagination
    if (filters.cursor) {
      const cursor = this.decodeCursor(filters.cursor);
      conditions.push(`(ts, audit_id) < ($${paramIndex++}, $${paramIndex++})`);
      values.push(cursor.ts, cursor.audit_id);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const limit = Math.min(filters.limit || 100, 1000);

    const selectSQL = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ts DESC, audit_id DESC
      LIMIT ${limit}
    `;

    const result = await this.db.query(selectSQL, values);
    
    return result.rows.map((row: any) => this.mapRowToRecord(row));
  }

  /**
   * Get total count for a query
   */
  async count(filters: AuditQueryFilters): Promise<number> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.tenant) {
      conditions.push(`tenant = $${paramIndex++}`);
      values.push(filters.tenant);
    }

    if (filters.itemId) {
      conditions.push(`item_id = $${paramIndex++}`);
      values.push(filters.itemId);
    }

    if (filters.startDate) {
      conditions.push(`ts >= $${paramIndex++}`);
      values.push(filters.startDate.toISOString());
    }

    if (filters.endDate) {
      conditions.push(`ts <= $${paramIndex++}`);
      values.push(filters.endDate.toISOString());
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countSQL = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      ${whereClause}
    `;

    const result = await this.db.query(countSQL, values);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Encode cursor for pagination
   */
  encodeCursor(ts: string, auditId: string): string {
    return Buffer.from(JSON.stringify({ ts, audit_id: auditId })).toString('base64');
  }

  /**
   * Decode cursor for pagination
   */
  private decodeCursor(encoded: string): { ts: string; audit_id: string } {
    return JSON.parse(Buffer.from(encoded, 'base64').toString());
  }

  /**
   * Map database row to AuditRecord
   */
  private mapRowToRecord(row: any): AuditRecord {
    return {
      audit_id: row.audit_id,
      ts: row.ts,
      tenant: row.tenant,
      profile: row.profile,
      route: row.route,
      item_id: row.item_id,
      transforms: typeof row.transforms === 'string' 
        ? JSON.parse(row.transforms) 
        : row.transforms,
      verdict: typeof row.verdict === 'string'
        ? JSON.parse(row.verdict)
        : row.verdict,
      latency_ms: parseFloat(row.latency_ms),
      degraded_mode: row.degraded_mode,
      degraded_services: row.degraded_services
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db && this.db.end) {
      await this.db.end();
    }
  }
}

