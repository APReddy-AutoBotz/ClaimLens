/**
 * SLO (Service Level Objective) Tracker for ClaimLens
 * Tracks availability and latency SLOs with error budget calculation
 */
/**
 * SLO Tracker class
 */
export class SLOTracker {
    slos = new Map();
    requestCounts = new Map(); // slo -> timestamp -> count
    failureCounts = new Map(); // slo -> timestamp -> count
    warningThreshold;
    criticalThreshold;
    constructor(config = {}) {
        this.warningThreshold = config.warningThreshold || 0.5;
        this.criticalThreshold = config.criticalThreshold || 0.8;
    }
    /**
     * Define an SLO
     */
    defineSLO(config) {
        const errorBudget = 1 - config.target;
        this.slos.set(config.name, {
            name: config.name,
            target: config.target,
            window: config.window,
            errorBudget,
        });
        // Initialize tracking maps
        this.requestCounts.set(config.name, new Map());
        this.failureCounts.set(config.name, new Map());
    }
    /**
     * Record a request
     */
    recordRequest(sloName, success) {
        const slo = this.slos.get(sloName);
        if (!slo) {
            throw new Error(`SLO ${sloName} not defined`);
        }
        const now = Math.floor(Date.now() / 1000); // Current second
        // Update request count
        const requests = this.requestCounts.get(sloName);
        requests.set(now, (requests.get(now) || 0) + 1);
        // Update failure count if failed
        if (!success) {
            const failures = this.failureCounts.get(sloName);
            failures.set(now, (failures.get(now) || 0) + 1);
        }
        // Cleanup old data
        this.cleanup(sloName, now, slo.window);
    }
    /**
     * Check SLO status
     */
    async checkSLO(name) {
        const slo = this.slos.get(name);
        if (!slo) {
            throw new Error(`SLO ${name} not defined`);
        }
        const now = Math.floor(Date.now() / 1000);
        const windowStart = now - slo.window;
        const total = this.getRequestCount(name, windowStart, now);
        const failed = this.getFailedCount(name, windowStart, now);
        if (total === 0) {
            return {
                name,
                successRate: 1.0,
                errorBudgetRemaining: 1.0,
                status: 'healthy',
                totalRequests: 0,
                failedRequests: 0,
            };
        }
        const successRate = (total - failed) / total;
        // Calculate error budget remaining
        // Error budget = allowed failures = total * (1 - target)
        // Budget consumed = actual failures / allowed failures
        const allowedFailures = total * (1 - slo.target);
        const budgetConsumed = allowedFailures > 0 ? failed / allowedFailures : 0;
        const errorBudgetRemaining = Math.max(0, 1 - budgetConsumed);
        // Determine status
        let status;
        if (successRate < slo.target) {
            status = 'violated';
        }
        else if (budgetConsumed >= this.criticalThreshold) {
            status = 'critical';
        }
        else if (budgetConsumed >= this.warningThreshold) {
            status = 'warning';
        }
        else {
            status = 'healthy';
        }
        return {
            name,
            successRate,
            errorBudgetRemaining,
            status,
            totalRequests: total,
            failedRequests: failed,
        };
    }
    /**
     * Get all SLO statuses
     */
    async checkAllSLOs() {
        const statuses = [];
        for (const name of this.slos.keys()) {
            statuses.push(await this.checkSLO(name));
        }
        return statuses;
    }
    /**
     * Get request count in time window
     */
    getRequestCount(sloName, startTime, endTime) {
        const requests = this.requestCounts.get(sloName);
        if (!requests)
            return 0;
        let total = 0;
        for (let t = startTime; t <= endTime; t++) {
            total += requests.get(t) || 0;
        }
        return total;
    }
    /**
     * Get failed request count in time window
     */
    getFailedCount(sloName, startTime, endTime) {
        const failures = this.failureCounts.get(sloName);
        if (!failures)
            return 0;
        let total = 0;
        for (let t = startTime; t <= endTime; t++) {
            total += failures.get(t) || 0;
        }
        return total;
    }
    /**
     * Cleanup old data outside window
     */
    cleanup(sloName, currentTime, window) {
        const cutoff = currentTime - window - 60; // Keep extra 60 seconds
        const requests = this.requestCounts.get(sloName);
        for (const [time] of requests) {
            if (time < cutoff) {
                requests.delete(time);
            }
        }
        const failures = this.failureCounts.get(sloName);
        for (const [time] of failures) {
            if (time < cutoff) {
                failures.delete(time);
            }
        }
    }
    /**
     * Get all defined SLOs
     */
    getSLOs() {
        return Array.from(this.slos.values());
    }
    /**
     * Reset all tracking data
     */
    reset() {
        for (const requests of this.requestCounts.values()) {
            requests.clear();
        }
        for (const failures of this.failureCounts.values()) {
            failures.clear();
        }
    }
}
/**
 * Default SLOs for ClaimLens routes
 */
export const defaultSLOs = [
    {
        name: '/v1/menu/feed',
        target: 0.995, // 99.5% availability
        window: 30 * 24 * 60 * 60, // 30 days
    },
    {
        name: '/v1/menu/validate',
        target: 0.995,
        window: 30 * 24 * 60 * 60,
    },
    {
        name: '/v1/web/ingest',
        target: 0.995,
        window: 30 * 24 * 60 * 60,
    },
    {
        name: '/v1/web/overlay',
        target: 0.995,
        window: 30 * 24 * 60 * 60,
    },
];
/**
 * Global SLO tracker instance
 */
export const sloTracker = new SLOTracker();
// Initialize default SLOs
for (const slo of defaultSLOs) {
    sloTracker.defineSLO(slo);
}
