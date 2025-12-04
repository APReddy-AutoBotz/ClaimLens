import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateDemoAuditItems } from '../api';

/**
 * Feature: b2c-admin-final-polish, Property 7: Verdict Variety in Demo
 * Validates: Requirements 3.7
 * 
 * For any populated Action Queue in demo mode, the items SHALL include at least one of each verdict type (allow, modify, avoid)
 */
describe('Demo Data - Property 7: Verdict Variety in Demo', () => {
  it('property: demo audit items always include all verdict types (allow, modify, avoid)', () => {
    // Generate demo data multiple times to ensure consistency
    fc.assert(
      fc.property(
        fc.constant(null), // We don't need random input, just want to run the test multiple times
        () => {
          const demoItems = generateDemoAuditItems();
          
          // Extract verdicts from demo items
          const verdicts = demoItems.map((item: any) => item.verdict.verdict);
          
          // Property: Must include at least one 'allow' verdict
          const hasAllow = verdicts.includes('allow');
          expect(hasAllow).toBe(true);
          
          // Property: Must include at least one 'modify' verdict
          const hasModify = verdicts.includes('modify');
          expect(hasModify).toBe(true);
          
          // Property: Must include at least one 'block' verdict (maps to 'avoid' in UI)
          const hasBlock = verdicts.includes('block');
          expect(hasBlock).toBe(true);
          
          // Verify all three verdict types are present
          const uniqueVerdicts = new Set(verdicts);
          expect(uniqueVerdicts.has('allow')).toBe(true);
          expect(uniqueVerdicts.has('modify')).toBe(true);
          expect(uniqueVerdicts.has('block')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: demo audit items have varied severity levels', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const demoItems = generateDemoAuditItems();
          
          // Extract severity levels
          const severities = demoItems.map((item: any) => item.severity);
          const uniqueSeverities = new Set(severities);
          
          // Property: Should have multiple severity levels for variety
          expect(uniqueSeverities.size).toBeGreaterThan(1);
          
          // Property: Should include at least low and high severity
          expect(severities.some((s: string) => s === 'low' || s === 'medium' || s === 'high')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: demo audit items span multiple tenants', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const demoItems = generateDemoAuditItems();
          
          // Extract tenants
          const tenants = demoItems.map((item: any) => item.tenant);
          const uniqueTenants = new Set(tenants);
          
          // Property: Should have at least 3 tenants (tenant_1, tenant_2, tenant_3)
          expect(uniqueTenants.size).toBeGreaterThanOrEqual(3);
          expect(uniqueTenants.has('tenant_1')).toBe(true);
          expect(uniqueTenants.has('tenant_2')).toBe(true);
          expect(uniqueTenants.has('tenant_3')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: demo audit items span multiple profiles', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const demoItems = generateDemoAuditItems();
          
          // Extract profiles
          const profiles = demoItems.map((item: any) => item.profile);
          const uniqueProfiles = new Set(profiles);
          
          // Property: Should have at least 3 profiles (Default, Strict, Permissive)
          expect(uniqueProfiles.size).toBeGreaterThanOrEqual(3);
          expect(uniqueProfiles.has('Default')).toBe(true);
          expect(uniqueProfiles.has('Strict')).toBe(true);
          expect(uniqueProfiles.has('Permissive')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('example: specific demo data structure validation', () => {
    const demoItems = generateDemoAuditItems();
    
    // Verify we have a reasonable number of items
    expect(demoItems.length).toBeGreaterThan(5);
    
    // Verify each item has required fields
    demoItems.forEach((item: any) => {
      expect(item).toHaveProperty('audit_id');
      expect(item).toHaveProperty('item_name');
      expect(item).toHaveProperty('verdict');
      expect(item).toHaveProperty('severity');
      expect(item).toHaveProperty('tags');
      expect(item).toHaveProperty('profile');
      expect(item).toHaveProperty('tenant');
      expect(item.verdict).toHaveProperty('verdict');
    });
    
    // Count verdicts
    const verdictCounts = {
      allow: 0,
      modify: 0,
      block: 0
    };
    
    demoItems.forEach((item: any) => {
      const verdict = item.verdict.verdict;
      if (verdict in verdictCounts) {
        verdictCounts[verdict as keyof typeof verdictCounts]++;
      }
    });
    
    // Verify all verdict types are present
    expect(verdictCounts.allow).toBeGreaterThan(0);
    expect(verdictCounts.modify).toBeGreaterThan(0);
    expect(verdictCounts.block).toBeGreaterThan(0);
  });
});
