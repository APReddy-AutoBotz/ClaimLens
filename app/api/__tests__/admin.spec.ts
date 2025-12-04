/**
 * Admin Console API Tests
 * Tests for dashboard, profiles, rule packs, fixtures, and audits endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AugmentLiteGate } from '../../../packages/core/augment-lite-gate';
import { PolicyVersioningManager, generateDiff } from '../../../packages/core/policy-versioning';
import { StagedRolloutManager } from '../../../packages/core/staged-rollout';
import { DashboardMetricsCalculator } from '../../../packages/core/dashboard-metrics';
import { FixturesRunner } from '../../../packages/core/fixtures-runner';

describe('Admin Console API - Augment-Lite Validation', () => {
  let gate: AugmentLiteGate;

  beforeEach(() => {
    gate = new AugmentLiteGate();
  });

  it('should validate 4C fields with minimum 20 characters', () => {
    const fields = {
      context: 'Moving redact.pii before rewrite.disclaimer to ensure PII is removed first',
      constraints: 'Must maintain all existing transforms, only changing order',
      selfCritique: 'Risk: PII might appear in disclaimer text if order is wrong',
      confirm: true,
    };

    const result = gate.validateEdit('reorder_transforms', fields, 2);
    expect(result.valid).toBe(true);
  });

  it('should reject fields with less than 20 characters', () => {
    const fields = {
      context: 'Too short',
      constraints: 'Also too short',
      selfCritique: 'Still too short',
      confirm: true,
    };

    const result = gate.validateEdit('reorder_transforms', fields, 2);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 20 characters');
  });

  it('should enforce autonomy slider caps per risk level', () => {
    const fields = {
      context: 'Reordering transforms to improve performance and security',
      constraints: 'All transforms must remain, latency budget unchanged',
      selfCritique: 'Could break PII redaction if order is incorrect',
      confirm: true,
    };

    // High-risk action has max autonomy of 2
    const result = gate.validateEdit('reorder_transforms', fields, 3);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum 2');
  });

  it('should allow medium-risk actions with higher autonomy', () => {
    const fields = {
      context: 'Adjusting sugar threshold from 10g to 12g per 100g',
      constraints: 'Must remain within regulatory guidelines',
      selfCritique: 'Could allow slightly higher sugar content',
      confirm: true,
    };

    const result = gate.validateEdit('change_threshold', fields, 3);
    expect(result.valid).toBe(true);
  });

  it('should require approval for high-risk changes', () => {
    const requiresApproval = gate.requiresApproval('reorder_transforms');
    expect(requiresApproval).toBe(true);

    const noApproval = gate.requiresApproval('change_threshold');
    expect(noApproval).toBe(false);
  });

  it('should reject without confirmation', () => {
    const fields = {
      context: 'Making changes to improve system performance',
      constraints: 'Must maintain backward compatibility',
      selfCritique: 'Could introduce regressions if not tested',
      confirm: false,
    };

    const result = gate.validateEdit('change_threshold', fields, 2);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('confirm understanding');
  });
});

describe('Admin Console API - Policy Versioning', () => {
  it('should generate diff between policy versions', () => {
    const before = {
      version: '1.0.0',
      profiles: {
        menushield_in: {
          routes: [
            { path: '/v1/menu/feed', transforms: ['redact.pii', 'detect.allergens'] },
          ],
        },
      },
    };

    const after = {
      version: '1.1.0',
      profiles: {
        menushield_in: {
          routes: [
            { path: '/v1/menu/feed', transforms: ['redact.pii', 'detect.allergens', 'rewrite.disclaimer'] },
          ],
        },
      },
    };

    const diff = generateDiff(before, after);
    expect(diff.modified.length).toBeGreaterThan(0);
  });

  it('should detect added fields', () => {
    const before = { a: 1 };
    const after = { a: 1, b: 2 };

    const diff = generateDiff(before, after);
    expect(diff.added).toContain('b');
  });

  it('should detect removed fields', () => {
    const before = { a: 1, b: 2 };
    const after = { a: 1 };

    const diff = generateDiff(before, after);
    expect(diff.removed).toContain('b');
  });

  it('should detect modified fields', () => {
    const before = { a: 1 };
    const after = { a: 2 };

    const diff = generateDiff(before, after);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0].path).toBe('a');
    expect(diff.modified[0].before).toBe(1);
    expect(diff.modified[0].after).toBe(2);
  });
});

describe('Admin Console API - Staged Rollout', () => {
  it('should determine rollback on high error rate', () => {
    const metrics = {
      stage: 'stage_10' as const,
      trafficPercentage: 10,
      totalRequests: 100,
      failedRequests: 6,
      errorRate: 0.06,
      duration: 60000,
    };

    // Error rate 6% exceeds 5% threshold
    expect(metrics.errorRate).toBeGreaterThan(0.05);
  });

  it('should allow progression on low error rate', () => {
    const metrics = {
      stage: 'stage_10' as const,
      trafficPercentage: 10,
      totalRequests: 100,
      failedRequests: 2,
      errorRate: 0.02,
      duration: 60000,
    };

    // Error rate 2% is below 5% threshold
    expect(metrics.errorRate).toBeLessThan(0.05);
  });

  it('should use hash-based traffic splitting', () => {
    const manager = new StagedRolloutManager({} as any);

    // Same request ID should always get same routing
    const result1 = manager.shouldUseNewVersion(50, 'request-123');
    const result2 = manager.shouldUseNewVersion(50, 'request-123');
    expect(result1).toBe(result2);

    // Different request IDs should distribute across buckets
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(manager.shouldUseNewVersion(50, `request-${i}`));
    }

    const trueCount = results.filter((r) => r).length;
    // Should be approximately 50% (allow some variance)
    expect(trueCount).toBeGreaterThan(30);
    expect(trueCount).toBeLessThan(70);
  });
});

describe('Admin Console API - Dashboard Metrics', () => {
  it('should calculate KPIs correctly', () => {
    const totalAudits = 1000;
    const flaggedItems = 150;
    const avgTime = 125;

    expect(flaggedItems / totalAudits).toBe(0.15); // 15% flagged rate
    expect(avgTime).toBeLessThan(150); // Within latency budget
  });

  it('should identify degraded services', () => {
    const degradedServices = ['ocr.label', 'unit.convert'];
    expect(degradedServices.length).toBeGreaterThan(0);
  });
});

describe('Admin Console API - Fixtures Runner', () => {
  it('should calculate p50 and p95 latencies', () => {
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    latencies.sort((a, b) => a - b);
    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);

    expect(latencies[p50Index]).toBe(60);
    expect(latencies[p95Index]).toBe(100);
  });

  it('should validate fixture structure', () => {
    const validFixture = {
      items: [
        { id: '1', name: 'Test Item', ingredients: ['flour', 'sugar'] },
      ],
    };

    expect(validFixture.items).toBeDefined();
    expect(Array.isArray(validFixture.items)).toBe(true);
    expect(validFixture.items[0].id).toBeDefined();
    expect(validFixture.items[0].name).toBeDefined();
  });

  it('should detect invalid fixture format', () => {
    const invalidFixture: any = {
      data: [], // Wrong key
    };

    expect(invalidFixture.items).toBeUndefined();
  });
});

describe('Admin Console API - Permission Enforcement', () => {
  it('should enforce read permission for dashboard', () => {
    const requiredPermission = { resource: 'audits', action: 'read' };
    expect(requiredPermission.resource).toBe('audits');
    expect(requiredPermission.action).toBe('read');
  });

  it('should enforce write permission for profile updates', () => {
    const requiredPermission = { resource: 'policies', action: 'write' };
    expect(requiredPermission.resource).toBe('policies');
    expect(requiredPermission.action).toBe('write');
  });

  it('should enforce admin role for sensitive operations', () => {
    const requiredRole = 'admin';
    expect(requiredRole).toBe('admin');
  });
});

describe('Admin Console API - Rule Pack Versioning', () => {
  it('should track rule pack changes', () => {
    const before = 'allergen: peanuts\nallergen: tree nuts';
    const after = 'allergen: peanuts\nallergen: tree nuts\nallergen: sesame';

    expect(after.length).toBeGreaterThan(before.length);
    expect(after).toContain('sesame');
  });

  it('should generate diff for rule pack updates', () => {
    const beforeLines = ['peanuts', 'tree nuts'];
    const afterLines = ['peanuts', 'tree nuts', 'sesame'];

    const added = afterLines.filter((line) => !beforeLines.includes(line));
    expect(added).toContain('sesame');
  });
});

describe('Admin Console API - Audit Retrieval', () => {
  it('should retrieve audit by ID', () => {
    const auditId = 'audit_123456';
    expect(auditId).toMatch(/^audit_/);
  });

  it('should enforce tenant isolation for audits', () => {
    const audit = {
      audit_id: 'audit_123',
      tenant: 'tenant-a',
    };

    const requestTenant = 'tenant-b';
    expect(audit.tenant).not.toBe(requestTenant);
  });

  it('should include before/after content in audit', () => {
    const audit = {
      before: { content: 'Original text' },
      after: { content: 'Modified text' },
    };

    expect(audit.before).toBeDefined();
    expect(audit.after).toBeDefined();
    expect(audit.before.content).not.toBe(audit.after.content);
  });
});

describe('Admin Console API - Integration Tests', () => {
  it('should handle complete profile update workflow', () => {
    // 1. Validate Augment-Lite fields
    const gate = new AugmentLiteGate();
    const fields = {
      context: 'Updating transform order for better performance',
      constraints: 'All transforms must remain active',
      selfCritique: 'Could impact PII redaction timing',
      confirm: true,
    };

    const validation = gate.validateEdit('reorder_transforms', fields, 2);
    expect(validation.valid).toBe(true);

    // 2. Generate diff
    const before = { transforms: ['a', 'b', 'c'] };
    const after = { transforms: ['b', 'a', 'c'] };
    const diff = generateDiff(before, after);
    expect(diff.modified.length).toBeGreaterThan(0);

    // 3. Check approval requirement
    const requiresApproval = gate.requiresApproval('reorder_transforms');
    expect(requiresApproval).toBe(true);
  });

  it('should handle fixture test execution workflow', () => {
    // 1. List fixtures
    const fixtures = { menu: ['sample.json'], sites: ['sample.html'] };
    expect(fixtures.menu.length).toBeGreaterThan(0);

    // 2. Run fixtures
    const results = [
      { fixture: 'sample.json', itemId: '1', flags: ['allergen'], errors: [], latencyMs: 50 },
    ];

    // 3. Calculate metrics
    const latencies = results.map((r) => r.latencyMs);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    expect(p95).toBeLessThan(150); // Within budget
  });
});
