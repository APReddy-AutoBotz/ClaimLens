/**
 * Dashboard Metrics Calculator
 * Computes KPIs for Admin Console dashboard
 */
// ============================================================================
// Dashboard Metrics Calculator
// ============================================================================
export class DashboardMetricsCalculator {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Calculate KPI metrics for dashboard
     */
    async calculateKPIs(tenant) {
        // Total audits processed
        const totalResult = await this.pool.query(`SELECT COUNT(*) as count FROM audits WHERE tenant_id = $1`, [tenant]);
        const totalAuditsProcessed = parseInt(totalResult.rows[0].count, 10);
        // Flagged items (modify or block verdicts)
        const flaggedResult = await this.pool.query(`SELECT COUNT(*) as count 
       FROM audits 
       WHERE tenant_id = $1 
       AND (verdict->>'verdict' = 'modify' OR verdict->>'verdict' = 'block')`, [tenant]);
        const flaggedItemsCount = parseInt(flaggedResult.rows[0].count, 10);
        // Average processing time
        const avgTimeResult = await this.pool.query(`SELECT AVG(latency_ms) as avg_time 
       FROM audits 
       WHERE tenant_id = $1`, [tenant]);
        const averageProcessingTimeMs = parseFloat(avgTimeResult.rows[0].avg_time || '0');
        // Last 24 hours metrics
        const last24HoursResult = await this.pool.query(`SELECT 
         COUNT(*) as audits,
         COUNT(CASE WHEN verdict->>'verdict' IN ('modify', 'block') THEN 1 END) as flagged,
         AVG(latency_ms) as avg_time
       FROM audits 
       WHERE tenant_id = $1 
       AND ts >= NOW() - INTERVAL '24 hours'`, [tenant]);
        // Last 7 days metrics
        const last7DaysResult = await this.pool.query(`SELECT 
         COUNT(*) as audits,
         COUNT(CASE WHEN verdict->>'verdict' IN ('modify', 'block') THEN 1 END) as flagged,
         AVG(latency_ms) as avg_time
       FROM audits 
       WHERE tenant_id = $1 
       AND ts >= NOW() - INTERVAL '7 days'`, [tenant]);
        return {
            totalAuditsProcessed,
            flaggedItemsCount,
            averageProcessingTimeMs: Math.round(averageProcessingTimeMs),
            last24Hours: {
                audits: parseInt(last24HoursResult.rows[0].audits, 10),
                flagged: parseInt(last24HoursResult.rows[0].flagged, 10),
                avgTimeMs: Math.round(parseFloat(last24HoursResult.rows[0].avg_time || '0')),
            },
            last7Days: {
                audits: parseInt(last7DaysResult.rows[0].audits, 10),
                flagged: parseInt(last7DaysResult.rows[0].flagged, 10),
                avgTimeMs: Math.round(parseFloat(last7DaysResult.rows[0].avg_time || '0')),
            },
        };
    }
    /**
     * Get recent audits for dashboard table
     */
    async getRecentAudits(tenant, limit = 20) {
        const result = await this.pool.query(`SELECT 
         audit_id,
         ts,
         verdict->>'verdict' as verdict,
         latency_ms
       FROM audits 
       WHERE tenant_id = $1 
       ORDER BY ts DESC 
       LIMIT $2`, [tenant, limit]);
        return result.rows.map((row) => ({
            audit_id: row.audit_id,
            ts: row.ts,
            item_name: 'Unknown', // Would need to join with items table or store in audit
            verdict: row.verdict,
            latency_ms: row.latency_ms,
        }));
    }
    /**
     * Get degraded services status
     */
    async getDegradedServices(tenant) {
        const result = await this.pool.query(`SELECT DISTINCT degraded_services 
       FROM audits 
       WHERE tenant_id = $1 
       AND degraded_mode = true 
       AND ts >= NOW() - INTERVAL '1 hour'
       LIMIT 1`, [tenant]);
        if (result.rows.length === 0 || !result.rows[0].degraded_services) {
            return [];
        }
        return result.rows[0].degraded_services;
    }
    /**
     * Get error rate for time window
     */
    async getErrorRate(tenant, windowMinutes = 60) {
        const result = await this.pool.query(`SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN verdict->>'verdict' = 'block' THEN 1 END) as errors
       FROM audits 
       WHERE tenant_id = $1 
       AND ts >= NOW() - INTERVAL '${windowMinutes} minutes'`, [tenant]);
        const total = parseInt(result.rows[0].total, 10);
        const errors = parseInt(result.rows[0].errors, 10);
        return total > 0 ? errors / total : 0;
    }
    /**
     * Get performance trends
     */
    async getPerformanceTrends(tenant, days = 7) {
        const result = await this.pool.query(`SELECT 
         DATE(ts) as date,
         AVG(latency_ms) as avg_latency,
         COUNT(*) as count
       FROM audits 
       WHERE tenant_id = $1 
       AND ts >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(ts)
       ORDER BY date ASC`, [tenant]);
        return result.rows.map((row) => ({
            date: row.date,
            avgLatencyMs: Math.round(parseFloat(row.avg_latency)),
            count: parseInt(row.count, 10),
        }));
    }
}
