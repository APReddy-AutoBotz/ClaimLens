/**
 * ClaimLens Transform Pipeline Engine
 * Orchestrates transform execution with policy-driven configuration
 */
import { AuditManager } from './audit-manager.js';
// ============================================================================
// Transform Registry
// ============================================================================
export class TransformRegistry {
    transforms = new Map();
    /**
     * Register a transform function
     */
    register(name, fn) {
        if (this.transforms.has(name)) {
            console.warn(`Transform ${name} already registered, overwriting`);
        }
        this.transforms.set(name, fn);
    }
    /**
     * Get a registered transform
     */
    get(name) {
        return this.transforms.get(name);
    }
    /**
     * Check if a transform is registered
     */
    has(name) {
        return this.transforms.has(name);
    }
    /**
     * Get all registered transform names
     */
    list() {
        return Array.from(this.transforms.keys());
    }
}
// ============================================================================
// Transform Pipeline
// ============================================================================
export class TransformPipeline {
    registry;
    policy = null;
    auditManager;
    constructor(auditManager) {
        this.registry = new TransformRegistry();
        this.auditManager = auditManager || new AuditManager();
    }
    /**
     * Load policy configuration
     */
    loadPolicy(policyData) {
        this.policy = policyData;
    }
    /**
     * Register a transform function
     */
    registerTransform(name, fn) {
        this.registry.register(name, fn);
    }
    /**
     * Get the transform registry
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Execute transform pipeline for a menu item
     */
    async execute(item, profile, context, routePath) {
        if (!this.policy) {
            throw new Error('Policy not loaded. Call loadPolicy() first.');
        }
        const profileConfig = this.policy.profiles[profile];
        if (!profileConfig) {
            throw new Error(`Profile ${profile} not found in policy`);
        }
        // Find the route (for now, use first route in profile)
        const route = profileConfig.routes[0];
        if (!route) {
            throw new Error(`No routes defined for profile ${profile}`);
        }
        const startTime = performance.now();
        const changes = [];
        const reasons = [];
        const transformExecutions = [];
        let currentText = item.description || item.name;
        const beforeContent = currentText;
        let modified = false;
        // Execute transforms in sequence
        for (const transformName of route.transforms) {
            const transform = this.registry.get(transformName);
            if (!transform) {
                console.warn(`Transform ${transformName} not registered, skipping`);
                continue;
            }
            try {
                const transformStart = performance.now();
                // Execute transform with timeout
                const result = await this.executeWithTimeout(transform, currentText, context, route.latency_budget_ms || 1000);
                const transformDuration = performance.now() - transformStart;
                // Record transform execution
                transformExecutions.push({
                    name: transformName,
                    duration_ms: transformDuration,
                    decision: result.modified ? 'modify' : (result.flags.length > 0 ? 'flag' : 'pass'),
                    metadata: result.metadata
                });
                // Process result
                if (result.modified) {
                    changes.push({
                        field: 'description',
                        before: currentText,
                        after: result.text
                    });
                    currentText = result.text;
                    modified = true;
                }
                // Collect reasons from flags
                if (result.flags && result.flags.length > 0) {
                    for (const flag of result.flags) {
                        reasons.push({
                            transform: transformName,
                            why: flag.explanation,
                            source: flag.source
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Transform ${transformName} failed:`, error);
                // Record failed transform execution
                transformExecutions.push({
                    name: transformName,
                    duration_ms: 0,
                    decision: 'pass',
                    metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
                });
                // Continue with next transform (graceful degradation)
                reasons.push({
                    transform: transformName,
                    why: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    source: 'system'
                });
            }
        }
        const totalDuration = performance.now() - startTime;
        // Determine verdict
        const verdictDecision = modified ? 'modify' : 'allow';
        // Generate audit ID
        const auditId = this.auditManager.generateAuditId();
        const verdict = {
            verdict: verdictDecision,
            changes,
            reasons,
            audit_id: auditId,
            correlation_id: context.correlationId
        };
        // Create audit context
        const auditContext = {
            tenant: context.tenant,
            profile,
            route: routePath || route.path,
            correlationId: context.correlationId,
            locale: context.locale,
            degradedMode: false, // TODO: Implement degraded mode detection
            degradedServices: []
        };
        // Create content snapshot
        const snapshot = this.auditManager.createSnapshot(item, beforeContent, currentText);
        // Create and save audit record
        const auditRecord = this.auditManager.createAuditRecord(auditId, auditContext, item, verdict, transformExecutions, totalDuration, snapshot);
        // Save audit record (async, don't block response)
        this.auditManager.saveAuditRecord(auditRecord).catch(error => {
            console.error('Failed to save audit record:', error);
        });
        return verdict;
    }
    /**
     * Execute transform with timeout
     */
    async executeWithTimeout(transform, input, context, timeoutMs) {
        return Promise.race([
            Promise.resolve(transform(input, context)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Transform timeout')), timeoutMs))
        ]);
    }
    /**
     * Get pipeline metrics
     */
    getMetrics() {
        return {
            total_duration_ms: 0,
            transform_durations: {},
            transforms_executed: 0
        };
    }
    /**
     * Get audit manager instance
     */
    getAuditManager() {
        return this.auditManager;
    }
}
