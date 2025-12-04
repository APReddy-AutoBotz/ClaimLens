/**
 * Audit Pack Generator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditPackGenerator } from '../audit-pack-generator';
import { AuditManager } from '../audit-manager';
import { readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import type { AuditRecord, Verdict, NormalizedMenuItem } from '../types';

describe('AuditPackGenerator', () => {
  let generator: AuditPackGenerator;
  let auditManager: AuditManager;
  const testOutputDir = 'dist/test-audit-packs';

  beforeEach(() => {
    generator = new AuditPackGenerator({
      outputDir: testOutputDir
    });
    auditManager = new AuditManager();
  });

  afterEach(async () => {
    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      await rm(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('generate', () => {
    it('should generate JSONL and Markdown files', async () => {
      const records = createTestRecords(3);
      const result = await generator.generate(records, 'test_pack_1');

      expect(result.jsonlPath).toContain('test_pack_1.jsonl');
      expect(result.mdPath).toContain('test_pack_1.md');
      expect(existsSync(result.jsonlPath)).toBe(true);
      expect(existsSync(result.mdPath)).toBe(true);
    });

    it('should generate valid JSONL format', async () => {
      const records = createTestRecords(3);
      const result = await generator.generate(records);

      const content = await readFile(result.jsonlPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(3);
      lines.forEach(line => {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty('audit_id');
        expect(parsed).toHaveProperty('ts');
        expect(parsed).toHaveProperty('verdict');
      });
    });

    it('should include performance metrics in summary', async () => {
      const records = createTestRecords(5);
      const result = await generator.generate(records);

      expect(result.summary.total_items).toBe(5);
      expect(result.summary.avg_latency_ms).toBeGreaterThan(0);
      expect(result.summary.p50_latency_ms).toBeGreaterThan(0);
      expect(result.summary.p95_latency_ms).toBeGreaterThan(0);
    });

    it('should calculate flags by transform correctly', async () => {
      const records = createTestRecords(5);
      const result = await generator.generate(records);

      expect(result.summary.flags_by_transform).toHaveProperty('test.transform');
      expect(result.summary.flags_by_transform['test.transform']).toBeGreaterThan(0);
    });

    it('should include before/after diffs in Markdown', async () => {
      const records = createTestRecords(2);
      records[0].verdict.changes = [{
        field: 'description',
        before: 'Original text',
        after: 'Modified text'
      }];

      const result = await generator.generate(records);
      const mdContent = await readFile(result.mdPath, 'utf-8');

      expect(mdContent).toContain('Before:');
      expect(mdContent).toContain('After:');
      expect(mdContent).toContain('Original text');
      expect(mdContent).toContain('Modified text');
    });

    it('should track degraded mode in summary', async () => {
      const records = createTestRecords(3);
      records[0].degraded_mode = true;
      records[0].degraded_services = ['ocr.label'];
      records[1].degraded_mode = true;
      records[1].degraded_services = ['recall.lookup'];

      const result = await generator.generate(records);

      expect(result.summary.degraded_mode_count).toBe(2);
    });

    it('should include degraded mode warning in Markdown', async () => {
      const records = createTestRecords(2);
      records[0].degraded_mode = true;
      records[0].degraded_services = ['ocr.label'];

      const result = await generator.generate(records);
      const mdContent = await readFile(result.mdPath, 'utf-8');

      expect(mdContent).toContain('Degraded Mode');
      expect(mdContent).toContain('ocr.label');
    });

    it('should separate modified and allowed items', async () => {
      const records = createTestRecords(4);
      records[0].verdict.verdict = 'modify';
      records[1].verdict.verdict = 'allow';
      records[2].verdict.verdict = 'modify';
      records[3].verdict.verdict = 'allow';

      const result = await generator.generate(records);
      const mdContent = await readFile(result.mdPath, 'utf-8');

      expect(mdContent).toContain('Modified Items (2)');
      expect(mdContent).toContain('Allowed Items (2)');
    });

    it('should include transform execution details', async () => {
      const records = createTestRecords(1);
      records[0].transforms = [
        { name: 'redact.pii', duration_ms: 5.2, decision: 'pass' },
        { name: 'rewrite.disclaimer', duration_ms: 8.7, decision: 'modify' }
      ];

      const result = await generator.generate(records);
      const mdContent = await readFile(result.mdPath, 'utf-8');

      expect(mdContent).toContain('Transform Execution');
      expect(mdContent).toContain('redact.pii');
      expect(mdContent).toContain('rewrite.disclaimer');
      expect(mdContent).toContain('5.2');
      expect(mdContent).toContain('8.7');
    });

    it('should throw error for empty records array', async () => {
      await expect(generator.generate([])).rejects.toThrow('No audit records provided');
    });

    it('should auto-generate pack ID if not provided', async () => {
      const records = createTestRecords(1);
      const result = await generator.generate(records);

      expect(result.jsonlPath).toMatch(/audit_\d+\.jsonl$/);
      expect(result.mdPath).toMatch(/audit_\d+\.md$/);
    });
  });
});

/**
 * Helper function to create test audit records
 */
function createTestRecords(count: number): AuditRecord[] {
  const records: AuditRecord[] = [];

  for (let i = 0; i < count; i++) {
    const record: AuditRecord = {
      audit_id: `audit_test_${i}`,
      ts: new Date(Date.now() + i * 1000).toISOString(),
      tenant: 'test_tenant',
      profile: 'menushield_in',
      route: '/v1/menu/feed',
      item_id: `item_${i}`,
      transforms: [
        {
          name: 'test.transform',
          duration_ms: 10 + i,
          decision: i % 2 === 0 ? 'modify' : 'pass'
        }
      ],
      verdict: {
        verdict: i % 2 === 0 ? 'modify' : 'allow',
        changes: i % 2 === 0 ? [{
          field: 'description',
          before: `Original ${i}`,
          after: `Modified ${i}`
        }] : [],
        reasons: [{
          transform: 'test.transform',
          why: `Test reason ${i}`,
          source: 'https://example.com'
        }],
        audit_id: `audit_test_${i}`,
        correlation_id: `corr_${i}`
      },
      latency_ms: 15 + i * 2,
      degraded_mode: false
    };

    records.push(record);
  }

  return records;
}

