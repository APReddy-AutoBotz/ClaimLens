/**
 * In-Memory Audit Storage Backend
 * For testing and development purposes
 */
export class InMemoryAuditStorage {
    records = new Map();
    /**
     * Save an audit record
     */
    async save(record) {
        this.records.set(record.audit_id, record);
    }
    /**
     * Get an audit record by ID
     */
    async get(auditId) {
        return this.records.get(auditId) || null;
    }
    /**
     * Query audit records with filters
     */
    async query(filters) {
        let results = Array.from(this.records.values());
        // Filter by tenant
        if (filters.tenant) {
            results = results.filter(r => r.tenant === filters.tenant);
        }
        // Filter by item ID
        if (filters.itemId) {
            results = results.filter(r => r.item_id === filters.itemId);
        }
        // Filter by correlation ID
        if (filters.correlationId) {
            results = results.filter(r => r.verdict.correlation_id === filters.correlationId);
        }
        // Filter by date range
        if (filters.startDate) {
            results = results.filter(r => new Date(r.ts) >= filters.startDate);
        }
        if (filters.endDate) {
            results = results.filter(r => new Date(r.ts) <= filters.endDate);
        }
        // Sort by timestamp (newest first)
        results.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
        // Handle cursor-based pagination
        if (filters.cursor) {
            try {
                const decoded = Buffer.from(filters.cursor, 'base64').toString();
                const cursorData = JSON.parse(decoded);
                const { last_ts, last_id } = cursorData;
                // Filter records after the cursor
                results = results.filter(r => {
                    const recordTime = new Date(r.ts).getTime();
                    const cursorTime = new Date(last_ts).getTime();
                    // Include records older than cursor timestamp
                    // or same timestamp but different ID (for stable pagination)
                    return recordTime < cursorTime ||
                        (recordTime === cursorTime && r.audit_id < last_id);
                });
            }
            catch (error) {
                // Invalid cursor, ignore it
            }
        }
        // Apply limit
        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }
        return results;
    }
    /**
     * Clear all records (for testing)
     */
    clear() {
        this.records.clear();
    }
    /**
     * Get total count of records
     */
    count() {
        return this.records.size;
    }
}
