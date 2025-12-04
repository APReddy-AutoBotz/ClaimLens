/**
 * Admin API Routes
 * Endpoints for policy management and audit trail
 */
import { Router } from 'express';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as yaml from 'yaml';
import { requirePermission, requireRole } from '../middleware/rbac';
import { Role } from '../../../packages/core/tenant-models';
import { PolicyChangeLogger } from '../../../packages/core/policy-change-logger';
import { AugmentLiteGate } from '../../../packages/core/augment-lite-gate';
import { PolicyVersioningManager } from '../../../packages/core/policy-versioning';
import { StagedRolloutManager } from '../../../packages/core/staged-rollout';
import { DashboardMetricsCalculator } from '../../../packages/core/dashboard-metrics';
import { FixturesRunner } from '../../../packages/core/fixtures-runner';
import { AuditManager } from '../../../packages/core/audit-manager';
import { InMemoryAuditStorage } from '../../../packages/core/audit-storage-memory';
import { TransformPipeline } from '../../../packages/core/pipeline';
import { PolicyLoader } from '../../../packages/core/policy-loader';
import { redactPiiTransform } from '../../../packages/transforms/redact.pii';
import { detectAllergensTransform } from '../../../packages/transforms/detect.allergens';
import { rewriteDisclaimerTransform } from '../../../packages/transforms/rewrite.disclaimer';
// Initialize dependencies
// Note: In production, these would be injected or configured via environment
// For now, we'll create a mock pool since this is route definition only
const pool = {
    query: async () => ({ rows: [] }),
};
const auditStorage = new InMemoryAuditStorage();
const auditManager = new AuditManager({
    enableStorage: true,
    storageBackend: auditStorage,
});
const policyLoader = new PolicyLoader({
    policyPath: resolve(process.cwd(), '.kiro/specs/policies.yaml'),
    rulePacksDir: resolve(process.cwd(), 'packs'),
});
const transformPipeline = new TransformPipeline(auditManager);
const policy = policyLoader.loadPolicy();
transformPipeline.loadPolicy(policy);
transformPipeline.registerTransform('redact.pii', redactPiiTransform);
transformPipeline.registerTransform('detect.allergens', detectAllergensTransform);
transformPipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);
const router = Router();
const changeLogger = new PolicyChangeLogger(pool);
const augmentLiteGate = new AugmentLiteGate();
const versioningManager = new PolicyVersioningManager(pool);
const rolloutManager = new StagedRolloutManager(pool);
const metricsCalculator = new DashboardMetricsCalculator(pool);
const fixturesRunner = new FixturesRunner(transformPipeline);
/**
 * GET /v1/admin/audit-trail
 * Get policy change history
 */
router.get('/audit-trail', requirePermission('audits', 'read'), (async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const changes = await changeLogger.getChangeHistory(req.tenant, limit, offset);
        res.json({
            changes,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve audit trail',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/audit-trail/export
 * Export audit trail as CSV
 */
router.get('/audit-trail/export', requirePermission('audits', 'read'), (async (req, res) => {
    try {
        const csv = await changeLogger.exportToCSV(req.tenant);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-trail-${req.tenant}-${Date.now()}.csv"`);
        res.send(csv);
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export audit trail',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/audit-trail/user/:userId
 * Get changes by specific user
 */
router.get('/audit-trail/user/:userId', requireRole(Role.ADMIN), (async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const changes = await changeLogger.getChangesByUser(userId, limit);
        res.json({
            changes,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve user changes',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/dashboard
 * Get dashboard KPI metrics
 */
router.get('/dashboard', requirePermission('audits', 'read'), (async (req, res) => {
    try {
        const kpis = await metricsCalculator.calculateKPIs(req.tenant);
        const recentAudits = await metricsCalculator.getRecentAudits(req.tenant, 20);
        const degradedServices = await metricsCalculator.getDegradedServices(req.tenant);
        res.json({
            kpis,
            recentAudits,
            degradedServices,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve dashboard metrics',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/profiles
 * List all profiles and routes
 */
router.get('/profiles', requirePermission('policies', 'read'), (async (req, res) => {
    try {
        const policyContent = await readFile('.kiro/specs/policies.yaml', 'utf-8');
        const policy = yaml.parse(policyContent);
        res.json({
            version: policy.version,
            profiles: policy.profiles,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve profiles',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * PUT /v1/admin/profiles/:id
 * Update profile configuration with Augment-Lite validation
 */
router.put('/profiles/:id', requirePermission('policies', 'write'), (async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const { profile, action, augmentLite, autonomy } = req.body;
        // Validate Augment-Lite fields
        const validation = augmentLiteGate.validateEdit(action, augmentLite, autonomy);
        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error,
                },
                correlation_id: req.correlationId,
            });
        }
        // Read current policy
        const currentContent = await readFile('.kiro/specs/policies.yaml', 'utf-8');
        const currentPolicy = yaml.parse(currentContent);
        // Update profile
        if (!currentPolicy.profiles[profileId]) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `Profile ${profileId} not found`,
                },
                correlation_id: req.correlationId,
            });
        }
        currentPolicy.profiles[profileId] = profile;
        const newContent = yaml.stringify(currentPolicy);
        // Create new version
        const versionRecord = await versioningManager.createNewVersion(currentContent, newContent, req.user.id, augmentLite.context);
        // Write updated policy
        await writeFile('.kiro/specs/policies.yaml', versionRecord.content, 'utf-8');
        // Log change
        await changeLogger.logChange(req.user, {
            action: 'profile_update',
            before: { profileId },
            after: { profileId, profile },
            augmentLite: augmentLite,
        });
        res.json({
            version: versionRecord.version,
            diff: versionRecord.diff,
            warnings: validation.warnings,
            requiresApproval: augmentLiteGate.requiresApproval(action),
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update profile',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/rule-packs
 * List rule packs with versions
 */
router.get('/rule-packs', requirePermission('rule_packs', 'read'), (async (req, res) => {
    try {
        const packs = [
            { name: 'allergens', path: 'packs/allergens.in.yaml' },
            { name: 'banned-claims', path: 'packs/banned.claims.in.yaml' },
            { name: 'disclaimers', path: 'packs/disclaimers.in.md' },
        ];
        const packDetails = await Promise.all(packs.map(async (pack) => {
            try {
                const content = await readFile(pack.path, 'utf-8');
                return {
                    name: pack.name,
                    path: pack.path,
                    size: content.length,
                    exists: true,
                };
            }
            catch {
                return {
                    name: pack.name,
                    path: pack.path,
                    size: 0,
                    exists: false,
                };
            }
        }));
        res.json({
            packs: packDetails,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve rule packs',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * PUT /v1/admin/rule-packs/:name
 * Update rule pack
 */
router.put('/rule-packs/:name', requirePermission('rule_packs', 'write'), (async (req, res) => {
    try {
        const { name } = req.params;
        const { content, augmentLite } = req.body;
        const packPath = `packs/${name}.in.yaml`;
        // Validate Augment-Lite fields
        const validation = augmentLiteGate.validateFields(augmentLite);
        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error,
                },
                correlation_id: req.correlationId,
            });
        }
        // Write updated pack
        await writeFile(packPath, content, 'utf-8');
        // Log change
        await changeLogger.logChange(req.user, {
            action: 'rule_pack_update',
            before: { name, path: packPath },
            after: { name, content: content.substring(0, 100) + '...' },
            augmentLite: augmentLite,
        });
        res.json({
            success: true,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update rule pack',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * POST /v1/admin/fixtures/run
 * Execute fixture tests
 */
router.post('/fixtures/run', requirePermission('policies', 'read'), (async (req, res) => {
    try {
        const { profile, fixtures } = req.body;
        if (!profile) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Profile is required',
                },
                correlation_id: req.correlationId,
            });
        }
        const summary = await fixturesRunner.runFixtures(profile, fixtures);
        res.json({
            summary,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to run fixtures',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/audits/:id
 * Retrieve audit details
 */
router.get('/audits/:id', requirePermission('audits', 'read'), (async (req, res) => {
    try {
        const { id } = req.params;
        const audit = await auditManager.getAuditRecord(id);
        if (!audit) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `Audit ${id} not found`,
                },
                correlation_id: req.correlationId,
            });
        }
        // Verify tenant access
        if (audit.tenant !== req.tenant) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this audit record',
                },
                correlation_id: req.correlationId,
            });
        }
        res.json({
            audit,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve audit',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/admin/fixtures/list
 * List available fixtures
 */
router.get('/fixtures/list', requirePermission('policies', 'read'), (async (req, res) => {
    try {
        const fixtures = await fixturesRunner.listFixtures();
        const stats = await fixturesRunner.getFixtureStats();
        res.json({
            fixtures,
            stats,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to list fixtures',
            },
            correlation_id: req.correlationId,
        });
    }
}));
export default router;
