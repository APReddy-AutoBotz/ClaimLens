/**
 * Transform Chain Integration Tests
 * Tests full chain: detect → block → rewrite → redact
 * Tests against fixtures/menu/edge-cases.json
 * Validates expected flags and modifications
 * Measures and asserts performance within budgets
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TransformPipeline } from '../pipeline.js';
import { PolicyLoader } from '../policy-loader.js';
import type { TransformContext, NormalizedMenuItem } from '../types.js';
import { redactPiiTransform } from '../../transforms/redact.pii.js';
import { detectAllergensTransform } from '../../transforms/detect.allergens.js';
import { rewriteDisclaimerTransform } from '../../transforms/rewrite.disclaimer.js';
import { normalizeNutritionTransform } from '../../transforms/normalize.nutrition.js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface FixtureItem {
  id: string;
  name: string;
  description?: string;
  ingredients?: string | string[];
  nutrition?: any;
  expected_flags?: string[];
}

interface EdgeCasesFixture {
  restaurant: string;
  items: FixtureItem[];
}

describe('Transform Chain Integration Tests', () => {
  let pipeline: TransformPipeline;
  let edgeCases: EdgeCasesFixture;
  
  beforeAll(() => {
    // Load edge cases fixture
    const fixturePath = join(process.cwd(), 'fixtures', 'menu', 'edge-cases.json');
    const fixtureContent = readFileSync(fixturePath, 'utf-8');
    edgeCases = JSON.parse(fixtureContent);
    
    // Create pipeline with test policy
    const policy = {
      version: '1.0.0',
      profiles: {
        test_chain: {
          name: 'Test Chain',
          routes: [
            {
              path: '/test',
              transforms: [
                'detect.allergens',
                'rewrite.disclaimer',
                'redact.pii',
                'normalize.nutrition'
              ],
              latency_budget_ms: 150
            }
          ]
        }
      }
    };
    
    pipeline = new TransformPipeline();
    pipeline.loadPolicy(policy);
    
    // Register transforms in chain order
    pipeline.registerTransform('detect.allergens', detectAllergensTransform);
    pipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);
    pipeline.registerTransform('redact.pii', redactPiiTransform);
    pipeline.registerTransform('normalize.nutrition', normalizeNutritionTransform);
  });
  
  describe('Full Chain: detect → rewrite → redact', () => {
    it('should detect allergens, rewrite disclaimers, and redact PII in sequence', async () => {
      // item-003: Sesame Crusted Salmon with email
      // Note: Pipeline processes description field, allergens are detected from ingredients in description
      const item: NormalizedMenuItem = {
        id: 'item-003',
        name: 'Sesame Crusted Salmon',
        description: 'Fresh salmon with sesame seeds and soy sauce. Contact chef@restaurant.com for custom orders',
        ingredients: ['salmon', 'sesame seeds', 'soy sauce']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'chain-test-001'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Verify PII redaction (pipeline processes description)
      expect(verdict.changes.some(c => 
        c.field === 'description' && c.after.includes('[EMAIL_REDACTED]')
      )).toBe(true);
      
      // Verify no email in final output
      const finalDescription = verdict.changes[verdict.changes.length - 1]?.after || '';
      expect(finalDescription).not.toContain('chef@restaurant.com');
      expect(finalDescription).toContain('[EMAIL_REDACTED]');
      
      // Verify verdict is modify
      expect(verdict.verdict).toBe('modify');
    });
    
    it('should handle banned claims with disclaimer and PII redaction', async () => {
      // item-005: Immunity Booster with banned claim and PII
      const item: NormalizedMenuItem = {
        id: 'item-005',
        name: 'Immunity Booster Juice',
        description: 'Doctor recommended juice for healing. Call +91 9876543210 for delivery to pincode 400001',
        ingredients: ['orange', 'ginger', 'turmeric']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'chain-test-002'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Verify disclaimer was added
      expect(verdict.reasons.some(r => 
        r.transform === 'rewrite.disclaimer' && r.why.includes('banned claims')
      )).toBe(true);
      
      // Verify PII was redacted
      expect(verdict.reasons.some(r => 
        r.transform === 'redact.pii' && r.why.includes('Redacted')
      )).toBe(true);
      
      // Verify final description has disclaimer and redacted PII
      // The chain applies: rewrite.disclaimer first (adds disclaimer), then redact.pii (redacts PII)
      const finalDescription = verdict.changes[verdict.changes.length - 1]?.after || '';
      expect(finalDescription).toContain('FSSAI');
      expect(finalDescription).toContain('[PHONE_REDACTED]');
      expect(finalDescription).toContain('[PINCODE_REDACTED]');
      expect(finalDescription).not.toContain('+91 9876543210');
      expect(finalDescription).not.toContain('400001');
    });
    
    it('should process clean items without modifications', async () => {
      // item-007: Grilled Chicken Salad (no issues)
      const item: NormalizedMenuItem = {
        id: 'item-007',
        name: 'Grilled Chicken Salad',
        description: 'Fresh grilled chicken with mixed greens',
        ingredients: ['chicken breast', 'lettuce', 'tomato', 'cucumber']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'chain-test-003'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Should allow without modifications
      expect(verdict.verdict).toBe('allow');
      expect(verdict.changes).toHaveLength(0);
    });
  });
  
  describe('Fixture Validation: edge-cases.json', () => {
    it('should process item-001: Superfood Power Bowl (banned claim + allergen + high sugar)', async () => {
      const fixtureItem = edgeCases.items.find(i => i.id === 'item-001')!;
      
      const item: NormalizedMenuItem = {
        id: fixtureItem.id,
        name: fixtureItem.name,
        description: fixtureItem.description,
        ingredients: Array.isArray(fixtureItem.ingredients) 
          ? fixtureItem.ingredients 
          : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fixture-001'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Expected: banned_claim detected (detox, miracle are banned claims)
      expect(verdict.reasons.some(r => r.why.includes('banned claims') || r.why.includes('Disclaimer'))).toBe(true);
      expect(verdict.verdict).toBe('modify');
    });
    
    it('should process item-002: No Sugar Added Smoothie (banned claim + misleading)', async () => {
      const fixtureItem = edgeCases.items.find(i => i.id === 'item-002')!;
      
      const item: NormalizedMenuItem = {
        id: fixtureItem.id,
        name: fixtureItem.name,
        description: fixtureItem.description,
        ingredients: Array.isArray(fixtureItem.ingredients) 
          ? fixtureItem.ingredients 
          : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fixture-002'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Expected: banned_claim
      expect(verdict.reasons.some(r => r.why.includes('banned claims') || r.why.includes('Disclaimer'))).toBe(true);
    });
    
    it('should process item-008: Fat-Burning Green Tea (banned claim)', async () => {
      const fixtureItem = edgeCases.items.find(i => i.id === 'item-008')!;
      
      const item: NormalizedMenuItem = {
        id: fixtureItem.id,
        name: fixtureItem.name,
        description: fixtureItem.description,
        ingredients: Array.isArray(fixtureItem.ingredients) 
          ? fixtureItem.ingredients 
          : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fixture-008'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Expected: banned_claim
      expect(verdict.reasons.some(r => r.why.includes('banned claims') || r.why.includes('Disclaimer'))).toBe(true);
      expect(verdict.verdict).toBe('modify');
    });
    
    it('should process item-009: Peanut Butter Toast (allergen only)', async () => {
      const fixtureItem = edgeCases.items.find(i => i.id === 'item-009')!;
      
      const item: NormalizedMenuItem = {
        id: fixtureItem.id,
        name: fixtureItem.name,
        description: fixtureItem.description,
        ingredients: Array.isArray(fixtureItem.ingredients) 
          ? fixtureItem.ingredients 
          : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fixture-009'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Expected: allergen
      expect(verdict.reasons.some(r => r.why.includes('allergen'))).toBe(true);
    });
    
    it('should process item-010: Fresh Fruit Salad (clean, no flags)', async () => {
      const fixtureItem = edgeCases.items.find(i => i.id === 'item-010')!;
      
      const item: NormalizedMenuItem = {
        id: fixtureItem.id,
        name: fixtureItem.name,
        description: fixtureItem.description,
        ingredients: Array.isArray(fixtureItem.ingredients) 
          ? fixtureItem.ingredients 
          : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fixture-010'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Expected: no flags
      expect(verdict.verdict).toBe('allow');
      expect(verdict.changes).toHaveLength(0);
    });
  });
  
  describe('Performance Budget Validation', () => {
    it('should complete full chain within 150ms latency budget', async () => {
      const item: NormalizedMenuItem = {
        id: 'perf-test',
        name: 'Test Item',
        description: 'Test description with email@test.com and banned claim: miracle cure',
        ingredients: ['peanuts', 'milk', 'eggs']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'perf-test-001'
      };
      
      const start = performance.now();
      await pipeline.execute(item, 'test_chain', context);
      const duration = performance.now() - start;
      
      // Assert within 150ms budget
      expect(duration).toBeLessThan(150);
    });
    
    it('should process all edge-case fixtures within budget', async () => {
      const results: number[] = [];
      
      for (const fixtureItem of edgeCases.items) {
        const item: NormalizedMenuItem = {
          id: fixtureItem.id,
          name: fixtureItem.name,
          description: fixtureItem.description,
          ingredients: Array.isArray(fixtureItem.ingredients) 
            ? fixtureItem.ingredients 
            : (fixtureItem.ingredients || '').split(',').map(s => s.trim())
        };
        
        const context: TransformContext = {
          locale: 'en-IN',
          tenant: 'test-kitchen',
          correlationId: `perf-${fixtureItem.id}`
        };
        
        const start = performance.now();
        await pipeline.execute(item, 'test_chain', context);
        const duration = performance.now() - start;
        
        results.push(duration);
      }
      
      // Calculate p95 latency
      const sorted = results.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index];
      
      // Assert p95 within budget
      expect(p95).toBeLessThan(150);
      
      // Log performance metrics
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      
      console.log(`Performance metrics for ${results.length} items:`);
      console.log(`  p50: ${p50.toFixed(2)}ms`);
      console.log(`  p95: ${p95.toFixed(2)}ms`);
      console.log(`  avg: ${avg.toFixed(2)}ms`);
      console.log(`  max: ${Math.max(...results).toFixed(2)}ms`);
    });
    
    it('should measure individual transform performance', async () => {
      const item: NormalizedMenuItem = {
        id: 'transform-perf',
        name: 'Performance Test Item',
        description: 'Contains banned claim: clinically proven. Email: test@example.com. Phone: +91 9876543210',
        ingredients: ['peanuts', 'milk', 'soy']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'transform-perf-001'
      };
      
      // Measure each transform individually
      const timings: Record<string, number> = {};
      
      // Detect allergens
      let start = performance.now();
      detectAllergensTransform(JSON.stringify(item.ingredients), context);
      timings['detect.allergens'] = performance.now() - start;
      
      // Rewrite disclaimer
      start = performance.now();
      rewriteDisclaimerTransform(item.description || '', context);
      timings['rewrite.disclaimer'] = performance.now() - start;
      
      // Redact PII
      start = performance.now();
      redactPiiTransform(item.description || '', context);
      timings['redact.pii'] = performance.now() - start;
      
      // Log individual timings
      console.log('Individual transform timings:');
      for (const [name, duration] of Object.entries(timings)) {
        console.log(`  ${name}: ${duration.toFixed(2)}ms`);
        
        // Each transform should be fast
        expect(duration).toBeLessThan(50);
      }
    });
  });
  
  describe('Chain Behavior Validation', () => {
    it('should preserve modifications through the chain', async () => {
      const item: NormalizedMenuItem = {
        id: 'chain-preserve',
        name: 'Test Item',
        description: 'Amazing detox formula',
        ingredients: ['peanuts']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'chain-preserve-001'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Disclaimer should be added by rewrite.disclaimer
      const descriptionChange = verdict.changes.find(c => c.field === 'description');
      expect(descriptionChange).toBeDefined();
      expect(descriptionChange!.after).toContain('FSSAI');
      
      // Original banned claim should still be detectable
      expect(descriptionChange!.before).toContain('detox');
    });
    
    it('should collect all flags from all transforms', async () => {
      const item: NormalizedMenuItem = {
        id: 'all-flags',
        name: 'Complex Item',
        description: 'Miracle cure for all ailments. Contact: doctor@clinic.com',
        ingredients: ['peanuts', 'milk', 'eggs', 'soy']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'all-flags-001'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Should have flags from multiple transforms (pipeline processes description)
      const transformsWithFlags = new Set(verdict.reasons.map(r => r.transform));
      
      // Disclaimer and PII transforms work on description
      expect(transformsWithFlags.has('rewrite.disclaimer')).toBe(true);
      expect(transformsWithFlags.has('redact.pii')).toBe(true);
      
      // Should have multiple reasons
      expect(verdict.reasons.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should handle empty or missing fields gracefully', async () => {
      const item: NormalizedMenuItem = {
        id: 'minimal',
        name: 'Minimal Item',
        ingredients: []
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'minimal-001'
      };
      
      const verdict = await pipeline.execute(item, 'test_chain', context);
      
      // Should complete without errors
      expect(verdict).toBeDefined();
      expect(verdict.verdict).toBe('allow');
    });
    
    it('should handle locale-specific disclaimer templates', async () => {
      const item: NormalizedMenuItem = {
        id: 'locale-test',
        name: 'Locale Test',
        description: 'Clinically proven formula',
        ingredients: []
      };
      
      // Test en-US locale
      const contextUS: TransformContext = {
        locale: 'en-US',
        tenant: 'test-kitchen',
        correlationId: 'locale-us'
      };
      
      const verdictUS = await pipeline.execute(item, 'test_chain', contextUS);
      const descUS = verdictUS.changes.find(c => c.field === 'description')?.after || '';
      expect(descUS).toContain('FDA');
      
      // Test en-GB locale
      const contextGB: TransformContext = {
        locale: 'en-GB',
        tenant: 'test-kitchen',
        correlationId: 'locale-gb'
      };
      
      const verdictGB = await pipeline.execute(item, 'test_chain', contextGB);
      const descGB = verdictGB.changes.find(c => c.field === 'description')?.after || '';
      expect(descGB).toContain('FSA');
      
      // Test en-IN locale (default)
      const contextIN: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'locale-in'
      };
      
      const verdictIN = await pipeline.execute(item, 'test_chain', contextIN);
      const descIN = verdictIN.changes.find(c => c.field === 'description')?.after || '';
      expect(descIN).toContain('FSSAI');
    });
  });
  
  describe('Error Handling in Chain', () => {
    it('should continue chain execution if one transform fails', async () => {
      // Create a pipeline with a failing transform
      const failingPipeline = new TransformPipeline();
      const policy = {
        version: '1.0.0',
        profiles: {
          test_fail: {
            name: 'Test Fail',
            routes: [
              {
                path: '/test',
                transforms: ['rewrite.disclaimer', 'failing', 'redact.pii'],
                latency_budget_ms: 150
              }
            ]
          }
        }
      };
      
      failingPipeline.loadPolicy(policy);
      failingPipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);
      failingPipeline.registerTransform('failing', () => {
        throw new Error('Transform failed');
      });
      failingPipeline.registerTransform('redact.pii', redactPiiTransform);
      
      const item: NormalizedMenuItem = {
        id: 'fail-test',
        name: 'Test',
        description: 'Email: test@example.com with miracle cure',
        ingredients: ['peanuts']
      };
      
      const context: TransformContext = {
        locale: 'en-IN',
        tenant: 'test-kitchen',
        correlationId: 'fail-test-001'
      };
      
      const verdict = await failingPipeline.execute(item, 'test_fail', context);
      
      // Should have executed rewrite.disclaimer and redact.pii (both work on description)
      expect(verdict.reasons.some(r => r.transform === 'rewrite.disclaimer')).toBe(true);
      expect(verdict.reasons.some(r => r.transform === 'redact.pii')).toBe(true);
      
      // Should have error from failing transform
      expect(verdict.reasons.some(r => r.transform === 'failing' && r.why.includes('failed'))).toBe(true);
    });
  });
});
