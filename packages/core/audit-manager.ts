/**
 * ClaimLens Audit Manager
 * Generates and manages audit records for content analysis
 */

import { randomUUID } from 'crypto';
import type {
  AuditRecord,
  TransformExecution,
  Verdict,
  NormalizedMenuItem
} from './types.js';

// ============================================================================
// Audit Manager Configuration
// ============================================================================

export interface AuditManagerConfig {
  enableStorage?: boolean;
  storageBackend?: AuditStorageBackend;
}

export interface AuditStorageBackend {
  save(record: AuditRecord): Promise<void>;
  get(auditId: string): Promise<AuditRecord | null>;
  query(filters: AuditQueryFilters): Promise<AuditRecord[]>;
}

export interface AuditQueryFilters {
  tenant?: string;
  startDate?: Date;
  endDate?: Date;
  itemId?: string;
  correlationId?: string;
  limit?: number;
  cursor?: string;
}

// ============================================================================
// Audit Context
// ============================================================================

export interface AuditContext {
  tenant: string;
  profile: string;
  route: string;
  correlationId: string;
  locale: string;
  degradedMode?: boolean;
  degradedServices?: string[];
}

// ============================================================================
// Audit Snapshot
// ============================================================================

export interface AuditSnapshot {
  before: {
    item: NormalizedMenuItem;
    content: string;
  };
  after: {
    content: string;
  };
}

// ============================================================================
// Audit Manager
// ============================================================================

export class AuditManager {
  private config: AuditManagerConfig;
  private storageBackend?: AuditStorageBackend;

  constructor(config: AuditManagerConfig = {}) {
    this.config = config;
    this.storageBackend = config.storageBackend;
  }

  /**
   * Generate a unique audit ID
   */
  generateAuditId(): string {
    return `audit_${randomUUID().replace(/-/g, '')}`;
  }

  /**
   * Create an audit record from pipeline execution
   */
  createAuditRecord(
    auditId: string,
    context: AuditContext,
    item: NormalizedMenuItem,
    verdict: Verdict,
    transformExecutions: TransformExecution[],
    latencyMs: number,
    snapshot: AuditSnapshot
  ): AuditRecord {
    const record: AuditRecord = {
      audit_id: auditId,
      ts: new Date().toISOString(),
      tenant: context.tenant,
      profile: context.profile,
      route: context.route,
      item_id: item.id,
      transforms: transformExecutions,
      verdict,
      latency_ms: latencyMs,
      degraded_mode: context.degradedMode || false,
      degraded_services: context.degradedServices
    };

    return record;
  }

  /**
   * Save an audit record to storage backend
   */
  async saveAuditRecord(record: AuditRecord): Promise<void> {
    if (this.config.enableStorage && this.storageBackend) {
      await this.storageBackend.save(record);
    }
  }

  /**
   * Retrieve an audit record by ID
   */
  async getAuditRecord(auditId: string): Promise<AuditRecord | null> {
    if (this.storageBackend) {
      return await this.storageBackend.get(auditId);
    }
    return null;
  }

  /**
   * Query audit records with filters
   */
  async queryAuditRecords(filters: AuditQueryFilters): Promise<AuditRecord[]> {
    if (this.storageBackend) {
      return await this.storageBackend.query(filters);
    }
    return [];
  }

  /**
   * Create a content snapshot for audit trail
   */
  createSnapshot(
    item: NormalizedMenuItem,
    beforeContent: string,
    afterContent: string
  ): AuditSnapshot {
    return {
      before: {
        item,
        content: beforeContent
      },
      after: {
        content: afterContent
      }
    };
  }
}

