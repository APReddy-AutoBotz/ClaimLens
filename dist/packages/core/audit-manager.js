/**
 * ClaimLens Audit Manager
 * Generates and manages audit records for content analysis
 */
import { randomUUID } from 'crypto';
// ============================================================================
// Audit Manager
// ============================================================================
export class AuditManager {
    config;
    storageBackend;
    constructor(config = {}) {
        this.config = config;
        this.storageBackend = config.storageBackend;
    }
    /**
     * Generate a unique audit ID
     */
    generateAuditId() {
        return `audit_${randomUUID().replace(/-/g, '')}`;
    }
    /**
     * Create an audit record from pipeline execution
     */
    createAuditRecord(auditId, context, item, verdict, transformExecutions, latencyMs, snapshot) {
        const record = {
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
    async saveAuditRecord(record) {
        if (this.config.enableStorage && this.storageBackend) {
            await this.storageBackend.save(record);
        }
    }
    /**
     * Retrieve an audit record by ID
     */
    async getAuditRecord(auditId) {
        if (this.storageBackend) {
            return await this.storageBackend.get(auditId);
        }
        return null;
    }
    /**
     * Query audit records with filters
     */
    async queryAuditRecords(filters) {
        if (this.storageBackend) {
            return await this.storageBackend.query(filters);
        }
        return [];
    }
    /**
     * Create a content snapshot for audit trail
     */
    createSnapshot(item, beforeContent, afterContent) {
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
