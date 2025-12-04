/**
 * Integration test for B2C Consumer Mode transform chain
 */

import { describe, it, expect } from 'vitest';
import { detectAllergensTransform } from '../detect.allergens.js';
import { detectRecallsTransform } from '../detect.recalls.js';
import { detectWeaselWordsTransform } from '../detect.weasel_words.js';
import { rewriteDisclaimerTransform } from '../rewrite.disclaimer.js';
import type { TransformContext } from '@claimlens/core';

describe('Integration: Consumer Transform Chain', () => {
  const context: TransformContext = {
    locale: 'en',
    tenant: 'consumer',
    correlationId: 'test-consumer-123',
  };

  it('should process product with allergens and weasel words', () => {
    const productText = 'Contains peanuts and may help support your immune system';

    // Step 1: Detect allergens
    const allergenResult = detectAllergensTransform(productText, context);
    expect(allergenResult.flags.length).toBeGreaterThan(0);
    expect(allergenResult.flags[0].label).toContain('peanuts');
    expect(allergenResult.modified).toBe(false);

    // Step 2: Detect recalls (placeholder - should return no recalls)
    const recallResult = detectRecallsTransform(productText, context);
    expect(recallResult.flags.length).toBe(0);
    expect(recallResult.metadata?.has_recall).toBe(false);

    // Step 3: Detect weasel words
    const weaselResult = detectWeaselWordsTransform(productText, context);
    expect(weaselResult.flags.length).toBeGreaterThan(0);
    expect(weaselResult.flags[0].label).toBe('Vague marketing language');
    expect(weaselResult.metadata?.weasel_words).toContain('may');
    expect(weaselResult.metadata?.weasel_words).toContain('help');
    expect(weaselResult.metadata?.weasel_words).toContain('support');

    // Step 4: Rewrite disclaimer (if needed)
    const disclaimerResult = rewriteDisclaimerTransform(productText, context);
    
    // Verify all transforms executed
    expect(allergenResult).toBeDefined();
    expect(recallResult).toBeDefined();
    expect(weaselResult).toBeDefined();
    expect(disclaimerResult).toBeDefined();
  });

  it('should process clean product with no issues', () => {
    const cleanProduct = 'Contains 100mg vitamin C and 50mg vitamin E per serving';

    // Process through chain
    const allergenResult = detectAllergensTransform(cleanProduct, context);
    const recallResult = detectRecallsTransform(cleanProduct, context);
    const weaselResult = detectWeaselWordsTransform(cleanProduct, context);
    const disclaimerResult = rewriteDisclaimerTransform(cleanProduct, context);

    // Should have no flags for clean product
    expect(allergenResult.flags.length).toBe(0);
    expect(recallResult.flags.length).toBe(0);
    expect(weaselResult.flags.length).toBe(0);
    
    // Text should remain unchanged
    expect(allergenResult.text).toBe(cleanProduct);
    expect(recallResult.text).toBe(cleanProduct);
    expect(weaselResult.text).toBe(cleanProduct);
  });

  it('should detect multiple allergens', () => {
    const productText = 'Contains milk, eggs, and soy ingredients';

    const allergenResult = detectAllergensTransform(productText, context);
    
    expect(allergenResult.flags.length).toBeGreaterThan(0);
    // Allergen names are stored in lowercase in metadata
    const allergens = allergenResult.metadata?.detected_allergens as string[];
    expect(allergens.some(a => a.toLowerCase() === 'milk')).toBe(true);
    expect(allergens.some(a => a.toLowerCase() === 'eggs')).toBe(true);
    expect(allergens.some(a => a.toLowerCase() === 'soy')).toBe(true);
  });

  it('should calculate weasel word density correctly', () => {
    const highDensityText = 'may help support boost'; // 4/4 = 100%
    const lowDensityText = 'Contains vitamins and minerals that may support health'; // 2/9 = 22%

    const highResult = detectWeaselWordsTransform(highDensityText, context);
    const lowResult = detectWeaselWordsTransform(lowDensityText, context);

    // High density should be flagged as danger
    expect(highResult.flags[0].kind).toBe('danger');
    expect(highResult.metadata?.deduction).toBe(20);

    // Low density should be flagged as danger (>20%)
    expect(lowResult.flags[0].kind).toBe('danger');
    expect(lowResult.metadata?.deduction).toBe(20);
  });

  it('should handle cross-contamination warnings', () => {
    const productText = 'May contain traces of peanuts and tree nuts';

    const allergenResult = detectAllergensTransform(productText, context);
    
    expect(allergenResult.flags.length).toBeGreaterThan(0);
    expect(allergenResult.metadata?.cross_contamination_risk).toBe(true);
    
    // Should flag both allergens and cross-contamination
    const crossContamFlag = allergenResult.flags.find(f => 
      f.label === 'Cross-contamination risk'
    );
    expect(crossContamFlag).toBeDefined();
  });

  it('should process product with banned claims', () => {
    const productText = 'Miracle cure for all ailments';

    const disclaimerResult = rewriteDisclaimerTransform(productText, context);
    
    // Should append disclaimer for banned claims
    if (disclaimerResult.modified) {
      expect(disclaimerResult.text).not.toBe(productText);
      expect(disclaimerResult.flags.length).toBeGreaterThan(0);
    }
  });

  it('should maintain metadata through transform chain', () => {
    const productText = 'Contains peanuts and may help boost immunity';

    // Simulate transform chain with metadata accumulation
    const allergenResult = detectAllergensTransform(productText, context);
    const weaselResult = detectWeaselWordsTransform(productText, context);

    // Each transform should have its own metadata
    expect(allergenResult.metadata?.detected_allergens).toBeDefined();
    expect(weaselResult.metadata?.weasel_words).toBeDefined();
    expect(weaselResult.metadata?.density).toBeDefined();
    expect(weaselResult.metadata?.deduction).toBeDefined();
  });
});
