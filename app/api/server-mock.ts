/**
 * ClaimLens Mock API Server
 * Provides mock data for Admin Console development
 * Runs on port 8080 without authentication or database requirements
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app: Express = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Correlation ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  res.setHeader('X-Correlation-ID', correlationId);
  (req as any).correlationId = correlationId;
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'claimlens-api',
    timestamp: new Date().toISOString(),
  });
});

// Helper: Generate sparkline data (7 days)
function generateSparklineData(baseValue: number, variance: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < 7; i++) {
    const randomVariance = (Math.random() - 0.5) * variance;
    data.push(Math.max(0, baseValue + randomVariance));
  }
  return data;
}

// Helper: Generate enhanced audit records
function generateEnhancedAuditRecords(count: number) {
  const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const tagTypes: Array<'banned_claim' | 'allergen' | 'recall' | 'pii'> = ['banned_claim', 'allergen', 'recall', 'pii'];
  const profiles = ['menushield_in', 'claimlens_go'];
  const routes = ['/v1/menu/feed', '/v1/menu/validate', '/v1/web/ingest'];
  const verdicts: Array<'allow' | 'modify' | 'block'> = ['allow', 'modify', 'block'];
  
  const audits = [];
  for (let i = 0; i < count; i++) {
    const hasBannedClaim = Math.random() > 0.7;
    const hasAllergen = Math.random() > 0.6;
    const hasPII = Math.random() > 0.8;
    const hasRecall = Math.random() > 0.95;
    
    const tags: Array<'banned_claim' | 'allergen' | 'recall' | 'pii'> = [];
    if (hasBannedClaim) tags.push('banned_claim');
    if (hasAllergen) tags.push('allergen');
    if (hasPII) tags.push('pii');
    if (hasRecall) tags.push('recall');
    
    const severity = tags.includes('recall') || tags.includes('banned_claim') ? 'high' : 
                     tags.includes('allergen') ? 'medium' : 'low';
    
    const verdict = tags.includes('recall') ? 'block' : 
                    tags.length > 0 ? 'modify' : 'allow';
    
    audits.push({
      audit_id: `aud_${String(i + 1).padStart(3, '0')}`,
      ts: new Date(Date.now() - (i * 3600000)).toISOString(),
      tenant: 'tenant_1',
      profile: profiles[Math.floor(Math.random() * profiles.length)],
      route: routes[Math.floor(Math.random() * routes.length)],
      item_id: `item_${String(i + 1).padStart(3, '0')}`,
      item_name: `Product ${i + 1}`,
      transforms: [],
      verdict: {
        verdict,
        changes: [],
        reasons: [],
        audit_id: `aud_${String(i + 1).padStart(3, '0')}`,
        correlation_id: randomUUID(),
      },
      latency_ms: Math.floor(Math.random() * 200) + 50,
      degraded_mode: false,
      severity,
      tags,
      pack_version: 'v2.1.0',
    });
  }
  
  return audits;
}

// GET /v1/admin/dashboard
app.get('/v1/admin/dashboard', (req: Request, res: Response) => {
  const timeRange = (req.query.time_range as string) || '7d';
  const profile = req.query.profile as string;
  const tenant = req.query.tenant as string;
  
  // Generate enhanced audit records
  const allAudits = generateEnhancedAuditRecords(20);
  
  // Filter audits based on query params
  let filteredAudits = allAudits;
  if (profile) {
    filteredAudits = filteredAudits.filter(a => a.profile === profile);
  }
  if (tenant) {
    filteredAudits = filteredAudits.filter(a => a.tenant === tenant);
  }
  
  // Calculate metrics from filtered audits
  const totalAudits = filteredAudits.length;
  const flaggedItems = filteredAudits.filter(a => a.verdict.verdict !== 'allow').length;
  const avgProcessingTime = filteredAudits.reduce((sum, a) => sum + a.latency_ms, 0) / totalAudits;
  
  // Count violations by type
  const bannedClaimsCount = filteredAudits.filter(a => a.tags.includes('banned_claim')).length;
  const allergensCount = filteredAudits.filter(a => a.tags.includes('allergen')).length;
  const recallsCount = filteredAudits.filter(a => a.tags.includes('recall')).length;
  const piiCount = filteredAudits.filter(a => a.tags.includes('pii')).length;
  
  // Calculate publish readiness
  const blockedItems = filteredAudits.filter(a => a.verdict.verdict === 'block').length;
  const needsReviewItems = filteredAudits.filter(a => a.verdict.verdict === 'modify').length;
  
  let publishStatus: 'ready' | 'needs_review' | 'block' = 'ready';
  if (blockedItems > 0) publishStatus = 'block';
  else if (needsReviewItems > 2) publishStatus = 'needs_review';
  
  const publishDrivers = [];
  if (needsReviewItems > 0) {
    publishDrivers.push({ label: `${needsReviewItems} items need review`, count: needsReviewItems, type: 'warning' });
  }
  if (bannedClaimsCount > 0) {
    publishDrivers.push({ label: `${bannedClaimsCount} policy violations`, count: bannedClaimsCount, type: 'danger' });
  }
  if (recallsCount > 0) {
    publishDrivers.push({ label: `${recallsCount} recall matches`, count: recallsCount, type: 'danger' });
  }
  if (publishDrivers.length === 0) {
    publishDrivers.push({ label: 'All items cleared', count: 0, type: 'success' });
  }
  
  // Calculate compliance risk
  const riskScore = Math.min(100, (bannedClaimsCount * 8) + (allergensCount * 3) + (recallsCount * 15));
  const riskLevel: 'low' | 'medium' | 'high' = riskScore > 50 ? 'high' : riskScore > 20 ? 'medium' : 'low';
  
  const riskDrivers = [];
  if (bannedClaimsCount > 0) riskDrivers.push({ type: 'Banned claims', count: bannedClaimsCount });
  if (allergensCount > 0) riskDrivers.push({ type: 'Allergen risks', count: allergensCount });
  if (recallsCount > 0) riskDrivers.push({ type: 'Recall matches', count: recallsCount });
  if (piiCount > 0) riskDrivers.push({ type: 'PII detected', count: piiCount });
  
  // Calculate SLO health
  const p95Latency = Math.floor(avgProcessingTime * 1.5);
  const latencyBudget = 300;
  const errorRate = Math.random() * 0.005; // 0-0.5%
  const circuitBreakerState: 'closed' | 'open' | 'half_open' = 'closed';
  
  // Generate sparkline data
  const sparklineData = {
    publish_readiness: generateSparklineData(blockedItems + needsReviewItems, 3),
    compliance_risk: generateSparklineData(riskScore, 15),
    slo_latency: generateSparklineData(p95Latency, 50),
    total_violations: generateSparklineData(bannedClaimsCount + allergensCount + recallsCount + piiCount, 5),
  };
  
  res.json({
    total_audits: totalAudits,
    flagged_items: flaggedItems,
    avg_processing_time: Math.round(avgProcessingTime * 10) / 10,
    degraded_services: [],
    policy_pack_version: 'v2.1.0',
    last_updated: new Date().toISOString(),
    
    // Enhanced metrics
    publish_readiness: {
      status: publishStatus,
      drivers: publishDrivers.slice(0, 3), // Max 3 drivers
    },
    
    compliance_risk: {
      level: riskLevel,
      score: riskScore,
      drivers: riskDrivers,
    },
    
    slo_health: {
      p95_latency_ms: p95Latency,
      latency_budget_ms: latencyBudget,
      error_rate: errorRate,
      circuit_breaker_state: circuitBreakerState,
    },
    
    top_violations: {
      banned_claims: bannedClaimsCount,
      allergens: allergensCount,
      recalls: recallsCount,
      pii: piiCount,
    },
    
    sparkline_data: sparklineData,
    
    recent_audits: filteredAudits.slice(0, 10), // Return top 10
  });
});

// Legacy dashboard endpoint (for backwards compatibility)
app.get('/v1/admin/dashboard/legacy', (req: Request, res: Response) => {
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
          { name: 'detect.allergens', duration_ms: 12, decision: 'pass' as const },
          { name: 'block.banned_claims', duration_ms: 8, decision: 'flag' as const },
          { name: 'rewrite.disclaimer', duration_ms: 15, decision: 'modify' as const },
        ],
        verdict: {
          verdict: 'modify' as const,
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
          { name: 'detect.allergens', duration_ms: 10, decision: 'flag' as const },
          { name: 'redact.pii', duration_ms: 5, decision: 'modify' as const },
        ],
        verdict: {
          verdict: 'modify' as const,
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
          { name: 'detect.allergens', duration_ms: 8, decision: 'pass' as const },
          { name: 'block.banned_claims', duration_ms: 5, decision: 'pass' as const },
        ],
        verdict: {
          verdict: 'allow' as const,
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
app.get('/v1/admin/profiles', (req: Request, res: Response) => {
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
app.get('/v1/admin/profiles/:id', (req: Request, res: Response) => {
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
  } else if (id === 'claimlens_go') {
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
  } else {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Profile ${id} not found`,
        correlation_id: (req as any).correlationId,
      },
    });
  }
});

// GET /v1/admin/rule-packs
app.get('/v1/admin/rule-packs', (req: Request, res: Response) => {
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
app.get('/v1/admin/rule-packs/:name', (req: Request, res: Response) => {
  const { name } = req.params;

  const packs: Record<string, any> = {
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
  } else {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Rule pack ${name} not found`,
        correlation_id: (req as any).correlationId,
      },
    });
  }
});

// GET /v1/admin/fixtures
app.get('/v1/admin/fixtures', (req: Request, res: Response) => {
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
app.post('/v1/admin/fixtures/run', (req: Request, res: Response) => {
  const { profile, fixtures } = req.body;

  if (!profile) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Profile is required',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  // Simulate fixture run results
  const results = (fixtures || ['fixtures/menu/sample.json']).map((fixture: string) => ({
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
      total_items: results.reduce((sum: number, r: any) => sum + r.items_processed, 0),
      total_flags: results.reduce((sum: number, r: any) => sum + r.flags, 0),
      avg_latency_p95: 28,
    },
    results,
    correlation_id: (req as any).correlationId,
  });
});

// POST /v1/admin/policy-changes
app.post('/v1/admin/policy-changes', (req: Request, res: Response) => {
  const { context, constraints, self_critique } = req.body;

  // Validation
  if (!context || context.length < 200) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Context must be at least 200 characters',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  if (!constraints || constraints.length < 100) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Constraints must be at least 100 characters',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  if (!self_critique || self_critique.length < 100) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Self-critique must be at least 100 characters',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  // Generate impact preview
  const affectedRules = ['rule_banned_claims_001', 'rule_banned_claims_015', 'rule_allergen_003'];
  const riskLevel: 'low' | 'medium' | 'high' = context.toLowerCase().includes('critical') ? 'high' : 
                                                 context.toLowerCase().includes('important') ? 'medium' : 'low';
  const estimatedImpact = `~${Math.floor(Math.random() * 100) + 20} items affected`;
  const confidence = 0.75 + (Math.random() * 0.2); // 0.75-0.95

  const policyChange: any = {
    id: `pc_${randomUUID().substring(0, 8)}`,
    timestamp: new Date().toISOString(),
    operator: 'admin@claimlens.com',
    context,
    constraints,
    self_critique,
    impact_preview: {
      affected_rules: affectedRules,
      risk_level: riskLevel,
      estimated_impact: estimatedImpact,
      confidence,
    },
    status: 'pending',
  };

  console.log(`📝 Policy change request created: ${policyChange.id} (${riskLevel} risk)`);

  res.json(policyChange);
});

// GET /v1/admin/audits/:id
app.get('/v1/admin/audits/:id', (req: Request, res: Response) => {
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
      { name: 'detect.allergens', duration_ms: 12, decision: 'pass' as const },
      { name: 'block.banned_claims', duration_ms: 8, decision: 'flag' as const },
      { name: 'rewrite.disclaimer', duration_ms: 15, decision: 'modify' as const },
      { name: 'redact.pii', duration_ms: 5, decision: 'pass' as const },
    ],
    verdict: {
      verdict: 'modify' as const,
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

// POST /v1/consumer/scan - B2C Consumer Scan Endpoint
app.post('/v1/consumer/scan', (req: Request, res: Response) => {
  const { input_type, input_data, locale, allergen_profile } = req.body;

  // Validation
  if (!input_type) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing required field: input_type',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  if (!input_data) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing required field: input_data',
        correlation_id: (req as any).correlationId,
      },
    });
  }

  // Simple trust score calculation based on content
  let trustScore = 100;
  const badges: any[] = [];
  const reasons: any[] = [];
  let userAllergensDetected: string[] = [];

  // Check for banned claims
  const bannedClaims = ['superfood', 'detox', 'miracle', 'boosts immunity', 'burns fat'];
  const lowerInput = input_data.toLowerCase();
  
  bannedClaims.forEach(claim => {
    if (lowerInput.includes(claim)) {
      trustScore -= 40;
      badges.push({
        kind: 'danger',
        label: `Banned Claim: ${claim.charAt(0).toUpperCase() + claim.slice(1)}`,
        explanation: `The term '${claim}' is not scientifically substantiated and is prohibited by regulatory authorities`,
        source: 'https://fssai.gov.in/claims',
      });
      reasons.push({
        transform: 'detect.banned_claims',
        why: `Found banned health claim: "${claim}"`,
        source: 'https://fssai.gov.in/claims',
      });
    }
  });

  // Check for weasel words
  const weaselWords = ['may help', 'could support', 'might', 'possibly'];
  let weaselCount = 0;
  weaselWords.forEach(word => {
    if (lowerInput.includes(word)) {
      weaselCount++;
    }
  });

  if (weaselCount > 0) {
    const deduction = weaselCount >= 3 ? 20 : weaselCount >= 2 ? 15 : 10;
    trustScore -= deduction;
    badges.push({
      kind: 'warn',
      label: 'Weasel Words',
      explanation: `Contains vague marketing language like '${weaselWords.find(w => lowerInput.includes(w))}'`,
      source: 'Marketing analysis',
    });
    reasons.push({
      transform: 'detect.weasel_words',
      why: `Found ${weaselCount} instances of vague marketing language`,
      source: 'Marketing analysis',
    });
  }

  // Check for user allergens
  if (allergen_profile && allergen_profile.length > 0) {
    allergen_profile.forEach((allergen: string) => {
      if (lowerInput.includes(allergen.toLowerCase())) {
        trustScore -= 20;
        userAllergensDetected.push(allergen);
        badges.push({
          kind: 'danger',
          label: `Allergen: ${allergen}`,
          explanation: `Contains ${allergen}, which is in your allergen profile`,
          source: 'User allergen profile',
        });
      }
    });

    if (userAllergensDetected.length > 0) {
      reasons.push({
        transform: 'detect.allergens',
        why: `Found ${userAllergensDetected.length} user allergen(s)`,
        source: 'User allergen profile',
      });
    }
  }

  // Clean bonus
  if (badges.length === 0) {
    trustScore += 10;
    badges.push({
      kind: 'ok',
      label: 'Clean Product',
      explanation: 'No issues detected',
      source: null,
    });
  }

  // Clamp score
  trustScore = Math.max(0, Math.min(110, trustScore));

  // Get verdict
  let verdict;
  if (trustScore >= 80) {
    verdict = {
      label: 'allow' as const,
      color: '#10B981',
      icon: '✓',
      explanation: 'This product appears safe with minimal concerns',
    };
  } else if (trustScore >= 50) {
    verdict = {
      label: 'caution' as const,
      color: '#F59E0B',
      icon: '⚠',
      explanation: 'This product has some concerns worth reviewing',
    };
  } else {
    verdict = {
      label: 'avoid' as const,
      color: '#EF4444',
      icon: '✕',
      explanation: 'This product has significant concerns',
    };
  }

  // Extract product information from input
  const extractProductInfo = (text: string) => {
    // Try to extract product name (first line or first sentence)
    const lines = text.split('\n').filter(l => l.trim());
    const productName = lines[0]?.trim().substring(0, 100) || 'Scanned Product';
    
    // Try to extract brand (look for common patterns)
    const brandMatch = text.match(/(?:brand|by|from)[\s:]+([A-Z][a-zA-Z\s&]+)/i);
    const brand = brandMatch ? brandMatch[1].trim().substring(0, 50) : undefined;
    
    // Extract category hints
    const categories = [];
    if (/juice|drink|beverage|smoothie/i.test(text)) categories.push('Beverages');
    if (/snack|chip|cracker|cookie/i.test(text)) categories.push('Snacks');
    if (/organic|natural|whole/i.test(text)) categories.push('Organic');
    if (/protein|energy|supplement/i.test(text)) categories.push('Supplements');
    if (/dairy|milk|cheese|yogurt/i.test(text)) categories.push('Dairy');
    
    // Extract key claims
    const claims = [];
    if (/organic/i.test(text)) claims.push('Organic');
    if (/gluten.free/i.test(text)) claims.push('Gluten-Free');
    if (/vegan/i.test(text)) claims.push('Vegan');
    if (/non.gmo/i.test(text)) claims.push('Non-GMO');
    if (/sugar.free|no sugar/i.test(text)) claims.push('Sugar-Free');
    
    return {
      product_name: productName,
      brand: brand,
      category: categories[0] || 'Food & Beverage',
      claims: claims.length > 0 ? claims : undefined,
      scanned_text_preview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    };
  };

  const productInfo = extractProductInfo(input_data);

  // Build response
  const response = {
    product_info: productInfo,
    trust_score: trustScore,
    verdict,
    badges,
    reasons,
    breakdown: {
      base: 100,
      banned_claims: badges.filter(b => b.label.includes('Banned')).length * -40,
      recalls: 0,
      allergens: userAllergensDetected.length * -20,
      weasel_words: weaselCount > 0 ? -(weaselCount >= 3 ? 20 : weaselCount >= 2 ? 15 : 10) : 0,
      clean_bonus: badges.length === 1 && badges[0].kind === 'ok' ? 10 : 0,
      final: trustScore,
    },
    user_allergens_detected: userAllergensDetected.length > 0 ? userAllergensDetected : undefined,
    correlation_id: (req as any).correlationId,
  };

  console.log(`✅ Consumer scan: ${input_type} → ${productInfo.product_name} → Trust Score: ${trustScore} (${verdict.label})`);

  res.json(response);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      correlation_id: (req as any).correlationId,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      correlation_id: (req as any).correlationId,
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
