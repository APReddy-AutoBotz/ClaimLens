/**
 * ClaimLens Mock API Server
 * Provides mock data for Admin Console development
 * Runs on port 8080 without authentication or database requirements
 */
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
const app = express();
const PORT = process.env.PORT || 8080;
// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
// Correlation ID middleware
app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    res.setHeader('X-Correlation-ID', correlationId);
    req.correlationId = correlationId;
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'claimlens-api',
        timestamp: new Date().toISOString(),
    });
});
// GET /v1/admin/dashboard
app.get('/v1/admin/dashboard', (req, res) => {
    res.json({
        total_audits: 1248,
        flagged_items: 87,
        avg_processing_time: 145.5,
        degraded_services: [],
        recent_audits: [
            {
                audit_id: 'aud_001',
                ts: new Date(Date.now() - 3600000).toISOString(),
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                item_id: 'item_001',
                item_name: 'Immunity Booster Juice',
                transforms: [
                    { name: 'detect.allergens', duration_ms: 12, decision: 'pass' },
                    { name: 'block.banned_claims', duration_ms: 8, decision: 'flag' },
                    { name: 'rewrite.disclaimer', duration_ms: 15, decision: 'modify' },
                ],
                verdict: {
                    verdict: 'modify',
                    changes: [
                        {
                            field: 'description',
                            before: 'Boosts immunity 100%',
                            after: 'May support immune function. Individual results may vary.',
                        },
                    ],
                    reasons: [
                        {
                            transform: 'block.banned_claims',
                            why: 'Detected banned health claim: "Boosts immunity 100%"',
                            source: 'https://fssai.gov.in/health-claims',
                        },
                        {
                            transform: 'rewrite.disclaimer',
                            why: 'Added regulatory disclaimer for health claim',
                        },
                    ],
                    audit_id: 'aud_001',
                    correlation_id: randomUUID(),
                },
                latency_ms: 35,
                degraded_mode: false,
            },
            {
                audit_id: 'aud_002',
                ts: new Date(Date.now() - 7200000).toISOString(),
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/feed',
                item_id: 'item_002',
                item_name: 'Honey Almond Granola',
                transforms: [
                    { name: 'detect.allergens', duration_ms: 10, decision: 'flag' },
                    { name: 'redact.pii', duration_ms: 5, decision: 'modify' },
                ],
                verdict: {
                    verdict: 'modify',
                    changes: [
                        {
                            field: 'description',
                            before: 'Contact us at 9876543210',
                            after: 'Contact us at [PHONE_REDACTED]',
                        },
                    ],
                    reasons: [
                        {
                            transform: 'detect.allergens',
                            why: 'Detected allergens: almonds (tree nuts)',
                            source: 'https://fssai.gov.in/allergens',
                        },
                        {
                            transform: 'redact.pii',
                            why: 'Redacted phone number for privacy',
                        },
                    ],
                    audit_id: 'aud_002',
                    correlation_id: randomUUID(),
                },
                latency_ms: 15,
                degraded_mode: false,
            },
            {
                audit_id: 'aud_003',
                ts: new Date(Date.now() - 10800000).toISOString(),
                tenant: 'tenant_1',
                profile: 'menushield_in',
                route: '/v1/menu/validate',
                item_id: 'item_003',
                item_name: 'Plain Idli',
                transforms: [
                    { name: 'detect.allergens', duration_ms: 8, decision: 'pass' },
                    { name: 'block.banned_claims', duration_ms: 5, decision: 'pass' },
                ],
                verdict: {
                    verdict: 'allow',
                    changes: [],
                    reasons: [],
                    audit_id: 'aud_003',
                    correlation_id: randomUUID(),
                },
                latency_ms: 13,
                degraded_mode: false,
            },
        ],
    });
});
// GET /v1/admin/profiles
app.get('/v1/admin/profiles', (req, res) => {
    res.json({
        version: '1.2.0',
        profiles: {
            menushield_in: {
                label: 'MenuShield (India)',
                routes: {
                    '/menu/feed': {
                        transforms: [
                            'detect.allergens',
                            'block.banned_claims',
                            'normalize.nutrition',
                            'rewrite.disclaimer',
                            'redact.pii',
                            'risk.callouts',
                        ],
                        quality: {
                            fixtures: 'fixtures/menu/*.json',
                            latency_budget_ms: 150,
                        },
                    },
                    '/menu/validate': {
                        transforms: ['detect.allergens', 'block.banned_claims'],
                        quality: {
                            latency_budget_ms: 100,
                        },
                    },
                },
            },
            claimlens_go: {
                label: 'ClaimLens Go (Browser Extension)',
                routes: {
                    '/web/ingest': {
                        transforms: [
                            'detect.allergens',
                            'block.banned_claims',
                            'rewrite.disclaimer',
                        ],
                        quality: {
                            fixtures: 'fixtures/sites/*.html',
                            latency_budget_ms: 120,
                        },
                    },
                },
            },
        },
    });
});
// GET /v1/admin/profiles/:id
app.get('/v1/admin/profiles/:id', (req, res) => {
    const { id } = req.params;
    if (id === 'menushield_in') {
        res.json({
            id: 'menushield_in',
            label: 'MenuShield (India)',
            routes: {
                '/menu/feed': {
                    transforms: [
                        'detect.allergens',
                        'block.banned_claims',
                        'normalize.nutrition',
                        'rewrite.disclaimer',
                        'redact.pii',
                        'risk.callouts',
                    ],
                    quality: {
                        fixtures: 'fixtures/menu/*.json',
                        latency_budget_ms: 150,
                    },
                },
                '/menu/validate': {
                    transforms: ['detect.allergens', 'block.banned_claims'],
                    quality: {
                        latency_budget_ms: 100,
                    },
                },
            },
        });
    }
    else if (id === 'claimlens_go') {
        res.json({
            id: 'claimlens_go',
            label: 'ClaimLens Go (Browser Extension)',
            routes: {
                '/web/ingest': {
                    transforms: [
                        'detect.allergens',
                        'block.banned_claims',
                        'rewrite.disclaimer',
                    ],
                    quality: {
                        fixtures: 'fixtures/sites/*.html',
                        latency_budget_ms: 120,
                    },
                },
            },
        });
    }
    else {
        res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: `Profile ${id} not found`,
                correlation_id: req.correlationId,
            },
        });
    }
});
// GET /v1/admin/rule-packs
app.get('/v1/admin/rule-packs', (req, res) => {
    res.json({
        packs: [
            {
                name: 'allergens',
                path: 'packs/allergens.in.yaml',
                version: '1.0.0',
                size: 2048,
                updated_at: '2025-11-01T10:00:00Z',
                updated_by: 'admin@claimlens.com',
            },
            {
                name: 'banned-claims',
                path: 'packs/banned.claims.in.yaml',
                version: '1.1.0',
                size: 4096,
                updated_at: '2025-11-02T09:30:00Z',
                updated_by: 'admin@claimlens.com',
            },
            {
                name: 'disclaimers',
                path: 'packs/disclaimers.in.md',
                version: '1.0.1',
                size: 1536,
                updated_at: '2025-10-30T14:20:00Z',
                updated_by: 'admin@claimlens.com',
            },
        ],
    });
});
// GET /v1/admin/rule-packs/:name
app.get('/v1/admin/rule-packs/:name', (req, res) => {
    const { name } = req.params;
    const packs = {
        allergens: {
            name: 'allergens',
            version: '1.0.0',
            content: `# Allergen Database
allergens:
  - name: "Peanuts"
    category: "legumes"
    severity: "high"
  - name: "Tree nuts"
    category: "nuts"
    severity: "high"
    examples: ["almonds", "cashews", "walnuts"]
  - name: "Milk"
    category: "dairy"
    severity: "medium"
  - name: "Eggs"
    category: "animal"
    severity: "medium"
  - name: "Soy"
    category: "legumes"
    severity: "low"`,
        },
        'banned-claims': {
            name: 'banned-claims',
            version: '1.1.0',
            content: `# Banned Health Claims (India - FSSAI)
banned_claims:
  - pattern: "cures? (cancer|diabetes|heart disease)"
    reason: "Disease cure claims prohibited"
    severity: "critical"
  - pattern: "100% (pure|natural|organic)"
    reason: "Absolute purity claims require certification"
    severity: "high"
  - pattern: "boosts? immunity"
    reason: "Immunity claims require substantiation"
    severity: "medium"`,
        },
        disclaimers: {
            name: 'disclaimers',
            version: '1.0.1',
            content: `# Regulatory Disclaimers

## Health Claims
Individual results may vary. Consult a healthcare professional.

## Allergen Warnings
May contain traces of [allergen]. Processed in a facility that handles [allergens].

## Nutritional Information
Values are approximate and may vary based on preparation method.`,
        },
    };
    if (packs[name]) {
        res.json(packs[name]);
    }
    else {
        res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: `Rule pack ${name} not found`,
                correlation_id: req.correlationId,
            },
        });
    }
});
// GET /v1/admin/fixtures
app.get('/v1/admin/fixtures', (req, res) => {
    res.json({
        fixtures: [
            {
                name: 'sample.json',
                path: 'fixtures/menu/sample.json',
                type: 'menu',
                items: 5,
            },
            {
                name: 'edge-peanut.json',
                path: 'fixtures/menu/edge-peanut.json',
                type: 'menu',
                items: 3,
            },
            {
                name: 'banned-claims.json',
                path: 'fixtures/menu/banned-claims.json',
                type: 'menu',
                items: 4,
            },
            {
                name: 'sample.html',
                path: 'fixtures/sites/sample.html',
                type: 'site',
                items: 1,
            },
            {
                name: 'clean.html',
                path: 'fixtures/sites/clean.html',
                type: 'site',
                items: 1,
            },
        ],
    });
});
// POST /v1/admin/fixtures/run
app.post('/v1/admin/fixtures/run', (req, res) => {
    const { profile, fixtures } = req.body;
    if (!profile) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Profile is required',
                correlation_id: req.correlationId,
            },
        });
    }
    // Simulate fixture run results
    const results = (fixtures || ['fixtures/menu/sample.json']).map((fixture) => ({
        fixture,
        status: 'passed',
        items_processed: 5,
        flags: 2,
        warnings: 1,
        errors: 0,
        p50_latency: 12,
        p95_latency: 28,
        transforms_run: [
            { name: 'detect.allergens', status: 'ok', findings: ['Almonds (tree nuts)'] },
            { name: 'block.banned_claims', status: 'ok', findings: ['100% pure'] },
            { name: 'rewrite.disclaimer', status: 'ok' },
            { name: 'redact.pii', status: 'ok', counts: { email: 0, phone: 1, pincode: 0 } },
        ],
        audit_pack_url: `/audits/fixture-${Date.now()}.jsonl`,
    }));
    res.json({
        summary: {
            total_fixtures: results.length,
            passed: results.length,
            failed: 0,
            total_items: results.reduce((sum, r) => sum + r.items_processed, 0),
            total_flags: results.reduce((sum, r) => sum + r.flags, 0),
            avg_latency_p95: 28,
        },
        results,
        correlation_id: req.correlationId,
    });
});
// GET /v1/admin/audits/:id
app.get('/v1/admin/audits/:id', (req, res) => {
    const { id } = req.params;
    // Return mock audit data
    res.json({
        audit_id: id,
        ts: new Date(Date.now() - 3600000).toISOString(),
        tenant: 'tenant_1',
        profile: 'menushield_in',
        route: '/v1/menu/feed',
        item_id: 'item_001',
        item_name: 'Immunity Booster Juice',
        transforms: [
            { name: 'detect.allergens', duration_ms: 12, decision: 'pass' },
            { name: 'block.banned_claims', duration_ms: 8, decision: 'flag' },
            { name: 'rewrite.disclaimer', duration_ms: 15, decision: 'modify' },
            { name: 'redact.pii', duration_ms: 5, decision: 'pass' },
        ],
        verdict: {
            verdict: 'modify',
            changes: [
                {
                    field: 'description',
                    before: 'Boosts immunity 100%. Contact: 9876543210',
                    after: 'May support immune function. Individual results may vary. Contact: [PHONE_REDACTED]',
                },
            ],
            reasons: [
                {
                    transform: 'block.banned_claims',
                    why: 'Detected banned health claim: "Boosts immunity 100%"',
                    source: 'https://fssai.gov.in/health-claims',
                },
                {
                    transform: 'rewrite.disclaimer',
                    why: 'Added regulatory disclaimer for health claim',
                },
                {
                    transform: 'redact.pii',
                    why: 'Redacted phone number for privacy compliance',
                },
            ],
            audit_id: id,
            correlation_id: randomUUID(),
        },
        latency_ms: 40,
        degraded_mode: false,
        before_content: 'Immunity Booster Juice - Boosts immunity 100%. Made with fresh oranges and ginger. Contact: 9876543210',
        after_content: 'Immunity Booster Juice - May support immune function. Individual results may vary. Made with fresh oranges and ginger. Contact: [PHONE_REDACTED]',
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'Internal server error',
            correlation_id: req.correlationId,
        },
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            correlation_id: req.correlationId,
        },
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 ClaimLens Mock API Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/v1/admin/dashboard`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
export default app;
