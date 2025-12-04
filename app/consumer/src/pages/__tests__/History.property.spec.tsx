/**
 * Property-Based Tests: History Page Product Names
 * 
 * **Feature: b2c-admin-final-polish, Property 2: Product Name Display Consistency**
 * **Validates: Requirements 1.2, 1.3**
 * 
 * Property: For any scan result displayed in History or Results, the product name 
 * shown SHALL match the productIdentity.name field
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import History from '../History';
import type { ScanHistoryItem } from '../../hooks/useScanHistory';
import type { ProductIdentity } from '../../types';

// Mock the useScanHistory hook
let mockHistory: ScanHistoryItem[] = [];
const mockClearHistory = vi.fn();
const mockRenameScan = vi.fn();

vi.mock('../../hooks/useScanHistory', () => ({
  useScanHistory: () => ({
    history: mockHistory,
    clearHistory: mockClearHistory,
    renameScan: mockRenameScan,
  }),
}));

// Reset mock history before each test
beforeEach(() => {
  mockHistory = [];
});

/**
 * Arbitrary for generating valid source types
 */
const sourceTypeArb = fc.constantFrom('url', 'screenshot', 'barcode', 'text');

/**
 * Arbitrary for generating valid product names (non-empty, non-whitespace strings with visible characters)
 * Filters out strings that are only whitespace or special characters that might not render properly
 */
const productNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .filter(s => /[a-zA-Z0-9]/.test(s)); // Must contain at least one alphanumeric character

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
 * Arbitrary for generating valid ScanHistoryItem objects
 */
const scanHistoryItemArb: fc.Arbitrary<ScanHistoryItem> = fc.record({
  id: fc.string({ minLength: 10, maxLength: 30 }),
  timestamp: fc.integer({ min: Date.now() - 30 * 24 * 60 * 60 * 1000, max: Date.now() }),
  productName: productNameArb,
  trustScore: fc.integer({ min: 0, max: 100 }),
  verdict: fc.constantFrom('allow', 'caution', 'avoid'),
  thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
  resultData: fc.base64String(),
  categories: fc.option(
    fc.array(
      fc.constantFrom('allergens', 'banned_claims', 'missing_disclaimers', 'weasel_words', 'recall_signals'),
      { minLength: 0, maxLength: 3 }
    ),
    { nil: undefined }
  ),
  productIdentity: fc.option(productIdentityArb, { nil: undefined }),
});

describe('Property 2: Product Name Display Consistency', () => {
  /**
   * **Feature: b2c-admin-final-polish, Property 2: Product Name Display Consistency**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any scan result displayed in History, the product name shown SHALL match 
   * the productIdentity.name field (or fall back to productName if productIdentity is missing)
   */
  it('displays product name from productIdentity when available', () => {
    fc.assert(
      fc.property(
        fc.array(scanHistoryItemArb, { minLength: 1, maxLength: 5 }),
        (historyItems) => {
          // Update mock history
          mockHistory.length = 0;
          mockHistory.push(...historyItems);

          // Render the History component
          const { container } = render(
            <BrowserRouter>
              <History />
            </BrowserRouter>
          );

          // Get the rendered text content
          const renderedText = container.textContent || '';

          // For each history item, verify the displayed name matches productIdentity.name or productName
          historyItems.forEach((item) => {
            const expectedName = item.productIdentity?.name || item.productName;
            
            // Check that the expected name appears in the rendered content
            expect(renderedText).toContain(expectedName);
          });

          return true;
        }
      ),
      { numRuns: 50 } // Reduced runs for UI tests
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 2: Product Name Display Consistency**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * When productIdentity is present, the displayed name must match productIdentity.name exactly
   */
  it('productIdentity.name takes precedence over productName', () => {
    fc.assert(
      fc.property(
        productIdentityArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (productIdentity, differentProductName) => {
          // Ensure the names are different
          fc.pre(productIdentity.name !== differentProductName);

          const historyItem: ScanHistoryItem = {
            id: 'test-id',
            timestamp: Date.now(),
            productName: differentProductName,
            trustScore: 75,
            verdict: 'allow',
            resultData: 'test-data',
            productIdentity: productIdentity,
          };

          // Update mock history
          mockHistory.length = 0;
          mockHistory.push(historyItem);

          // Render the History component
          render(
            <BrowserRouter>
              <History />
            </BrowserRouter>
          );

          // Verify that productIdentity.name is displayed, not productName
          // Use trimmed version since HTML rendering trims whitespace
          const trimmedIdentityName = productIdentity.name.trim();
          const trimmedProductName = differentProductName.trim();
          expect(screen.queryAllByText(trimmedIdentityName).length).toBeGreaterThan(0);
          expect(screen.queryByText(trimmedProductName)).toBeNull();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 2: Product Name Display Consistency**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * When productIdentity is missing, productName should be displayed
   */
  it('falls back to productName when productIdentity is missing', () => {
    fc.assert(
      fc.property(productNameArb, (productName) => {
        const historyItem: ScanHistoryItem = {
          id: 'test-id',
          timestamp: Date.now(),
          productName: productName,
          trustScore: 75,
          verdict: 'allow',
          resultData: 'test-data',
          // No productIdentity
        };

        // Update mock history
        mockHistory.length = 0;
        mockHistory.push(historyItem);

        // Render the History component
        render(
          <BrowserRouter>
            <History />
          </BrowserRouter>
        );

        // Verify that productName is displayed
        // Use trimmed version since HTML rendering trims whitespace
        const trimmedProductName = productName.trim();
        expect(screen.queryAllByText(trimmedProductName).length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 2: Product Name Display Consistency**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * Source type information should be displayed when productIdentity is present
   */
  it('displays source type chip when productIdentity is present', () => {
    fc.assert(
      fc.property(
        fc.array(scanHistoryItemArb, { minLength: 1, maxLength: 5 }),
        (historyItems) => {
          // Filter to only items with productIdentity
          const itemsWithIdentity = historyItems.filter((item) => item.productIdentity);
          
          if (itemsWithIdentity.length === 0) {
            return true; // Skip if no items have productIdentity
          }

          // Update mock history
          mockHistory.length = 0;
          mockHistory.push(...itemsWithIdentity);

          // Render the History component
          const { container } = render(
            <BrowserRouter>
              <History />
            </BrowserRouter>
          );

          // For each item with productIdentity, verify source type is displayed
          itemsWithIdentity.forEach((item) => {
            if (item.productIdentity) {
              const sourceLabel = item.productIdentity.sourceLabel || getSourceTypeLabel(item.productIdentity.sourceType);
              // Check that source information appears somewhere in the document
              const hasSourceInfo = container.textContent?.includes(sourceLabel);
              expect(hasSourceInfo).toBe(true);
            }
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// Helper function to match the one in History.tsx
function getSourceTypeLabel(sourceType: 'url' | 'screenshot' | 'barcode' | 'text'): string {
  switch (sourceType) {
    case 'url': return 'Web URL';
    case 'screenshot': return 'Screenshot';
    case 'barcode': return 'Barcode';
    case 'text': return 'Text';
    default: return 'Scan';
  }
}
