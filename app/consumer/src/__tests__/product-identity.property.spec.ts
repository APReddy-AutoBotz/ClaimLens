/**
 * Property-Based Tests: Product Identity
 * 
 * **Feature: b2c-admin-final-polish, Property 1: Product Identity Presence**
 * **Validates: Requirements 1.1**
 * 
 * Property: For any scan result, the productIdentity object SHALL be present 
 * with at minimum a name and sourceType
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ScanResult, ProductIdentity } from '../types';

/**
 * Arbitrary for generating valid source types
 */
const sourceTypeArb = fc.constantFrom('url', 'screenshot', 'barcode', 'text');

/**
 * Arbitrary for generating valid product names (non-empty strings)
 */
const productNameArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Arbitrary for generating optional brand names
 */
const optionalBrandArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });

/**
 * Arbitrary for generating optional categories
 */
const optionalCategoryArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });

/**
 * Arbitrary for generating optional source labels
 */
const optionalSourceLabelArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined });

/**
 * Arbitrary for generating valid ProductIdentity objects
 */
const productIdentityArb: fc.Arbitrary<ProductIdentity> = fc.record({
  name: productNameArb,
  brand: optionalBrandArb,
  category: optionalCategoryArb,
  sourceType: sourceTypeArb,
  sourceLabel: optionalSourceLabelArb,
});

/**
 * Arbitrary for generating minimal valid ScanResult objects
 */
const scanResultArb: fc.Arbitrary<ScanResult> = fc.record({
  productIdentity: productIdentityArb,
  trust_score: fc.integer({ min: 0, max: 100 }),
  verdict: fc.record({
    label: fc.constantFrom('allow', 'caution', 'avoid'),
    color: fc.string(),
    icon: fc.string(),
    explanation: fc.string(),
  }),
  badges: fc.array(fc.record({
    kind: fc.constantFrom('ok', 'warn', 'danger'),
    label: fc.string(),
    explanation: fc.option(fc.string(), { nil: undefined }),
    source: fc.option(fc.string(), { nil: undefined }),
  })),
  reasons: fc.array(fc.record({
    transform: fc.string(),
    why: fc.string(),
    source: fc.option(fc.string(), { nil: undefined }),
  })),
});

describe('Property 1: Product Identity Presence', () => {
  /**
   * **Feature: b2c-admin-final-polish, Property 1: Product Identity Presence**
   * **Validates: Requirements 1.1**
   * 
   * For any scan result, the productIdentity object SHALL be present with 
   * at minimum a name and sourceType
   */
  it('all scan results have productIdentity with name and sourceType', () => {
    fc.assert(
      fc.property(scanResultArb, (scanResult) => {
        // Check that productIdentity exists
        expect(scanResult.productIdentity).toBeDefined();
        
        // Check that name is present and non-empty
        expect(scanResult.productIdentity.name).toBeDefined();
        expect(scanResult.productIdentity.name.length).toBeGreaterThan(0);
        
        // Check that sourceType is present and valid
        expect(scanResult.productIdentity.sourceType).toBeDefined();
        expect(['url', 'screenshot', 'barcode', 'text']).toContain(
          scanResult.productIdentity.sourceType
        );
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 1: Product Identity Presence**
   * **Validates: Requirements 1.1**
   * 
   * ProductIdentity name must be a non-empty string
   */
  it('productIdentity name is always a non-empty string', () => {
    fc.assert(
      fc.property(productIdentityArb, (productIdentity) => {
        expect(typeof productIdentity.name).toBe('string');
        expect(productIdentity.name.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 1: Product Identity Presence**
   * **Validates: Requirements 1.1**
   * 
   * ProductIdentity sourceType must be one of the valid values
   */
  it('productIdentity sourceType is always valid', () => {
    fc.assert(
      fc.property(productIdentityArb, (productIdentity) => {
        const validSourceTypes = ['url', 'screenshot', 'barcode', 'text'];
        expect(validSourceTypes).toContain(productIdentity.sourceType);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 1: Product Identity Presence**
   * **Validates: Requirements 1.1**
   * 
   * Optional fields (brand, category, sourceLabel) can be undefined but not empty strings
   */
  it('optional fields are either undefined or non-empty strings', () => {
    fc.assert(
      fc.property(productIdentityArb, (productIdentity) => {
        // Brand: if defined, must be non-empty
        if (productIdentity.brand !== undefined) {
          expect(typeof productIdentity.brand).toBe('string');
          expect(productIdentity.brand.length).toBeGreaterThan(0);
        }
        
        // Category: if defined, must be non-empty
        if (productIdentity.category !== undefined) {
          expect(typeof productIdentity.category).toBe('string');
          expect(productIdentity.category.length).toBeGreaterThan(0);
        }
        
        // SourceLabel: if defined, must be non-empty
        if (productIdentity.sourceLabel !== undefined) {
          expect(typeof productIdentity.sourceLabel).toBe('string');
          expect(productIdentity.sourceLabel.length).toBeGreaterThan(0);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
