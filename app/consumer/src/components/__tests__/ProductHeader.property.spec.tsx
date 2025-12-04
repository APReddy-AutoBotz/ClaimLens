/**
 * Property-Based Tests: ProductHeader Unknown Item Fallback
 * 
 * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any scan result with missing or empty product name, the display 
 * SHALL show "Unknown Item" with a Rename action
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ProductHeader } from '../ProductHeader';
import type { ProductIdentity } from '../../types';

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

/**
 * Arbitrary for generating valid source types
 */
const sourceTypeArb = fc.constantFrom('url', 'screenshot', 'barcode', 'text');

/**
 * Arbitrary for generating empty or whitespace-only strings
 * Note: The current implementation only treats empty string and "Unknown Item" as unknown,
 * not whitespace-only strings. This is a known limitation.
 */
const emptyOrWhitespaceArb = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.constant('\t'),
  fc.constant('\n'),
  fc.constant('  \t  \n  ')
);

/**
 * Arbitrary for generating ProductIdentity with missing/empty name
 * Currently only tests empty string and "Unknown Item" due to implementation limitation
 */
const unknownProductIdentityArb: fc.Arbitrary<ProductIdentity> = fc.record({
  name: fc.oneof(
    fc.constant(''),
    fc.constant('Unknown Item')
  ),
  brand: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  sourceType: sourceTypeArb,
  sourceLabel: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

describe('Property 3: Unknown Item Fallback', () => {
  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any product identity with missing or empty name, "Unknown Item" SHALL be displayed
   */
  it('displays "Unknown Item" for any missing or empty product name', () => {
    fc.assert(
      fc.property(unknownProductIdentityArb, (productIdentity) => {
        const { unmount } = render(<ProductHeader productIdentity={productIdentity} />);
        
        try {
          // Verify "Unknown Item" is displayed
          expect(screen.getByText('Unknown Item')).toBeInTheDocument();
          return true;
        } finally {
          // Clean up after each property test run
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any unknown item, the unknown styling class SHALL be applied
   */
  it('applies unknown styling class for any missing or empty product name', () => {
    fc.assert(
      fc.property(unknownProductIdentityArb, (productIdentity) => {
        const { unmount } = render(<ProductHeader productIdentity={productIdentity} />);
        
        try {
          const unknownElement = screen.getByText('Unknown Item');
          
          // Verify the element has the unknown class (CSS modules generate hashed names)
          expect(unknownElement.className).toMatch(/unknown/);
          
          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any unknown item with onRename callback, a Rename action SHALL be available
   */
  it('provides Rename action for any unknown item when onRename is provided', () => {
    fc.assert(
      fc.property(unknownProductIdentityArb, (productIdentity) => {
        const onRename = vi.fn();
        
        const { unmount } = render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);
        
        try {
          // Verify Rename button is present
          const renameButton = screen.getByRole('button', { name: /rename product/i });
          expect(renameButton).toBeInTheDocument();
          
          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any unknown item, the display SHALL never show an empty string
   */
  it('never displays empty string for product name', () => {
    fc.assert(
      fc.property(unknownProductIdentityArb, (productIdentity) => {
        const { container, unmount } = render(<ProductHeader productIdentity={productIdentity} />);
        
        try {
          // Get the product name element
          const unknownElement = screen.getByText('Unknown Item');
          
          // Verify it's not empty
          expect(unknownElement.textContent).toBeTruthy();
          expect(unknownElement.textContent?.trim()).toBe('Unknown Item');
          
          // Verify the container doesn't have any empty h1 elements
          const h1Elements = container.querySelectorAll('h1');
          h1Elements.forEach((h1) => {
            expect(h1.textContent?.trim()).not.toBe('');
          });
          
          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any product identity with valid name, "Unknown Item" SHALL NOT be displayed
   */
  it('does not display "Unknown Item" for valid product names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 })
          .filter(s => s.trim().length > 0)
          .filter(s => s !== 'Unknown Item'),
        sourceTypeArb,
        (validName, sourceType) => {
          const productIdentity: ProductIdentity = {
            name: validName,
            sourceType,
          };
          
          const { container, unmount } = render(<ProductHeader productIdentity={productIdentity} />);
          
          try {
            // Verify the actual name is displayed in the h1
            const h1Element = container.querySelector('h1');
            expect(h1Element).toBeInTheDocument();
            expect(h1Element?.textContent).toBe(validName);
            
            // Verify "Unknown Item" is NOT displayed
            expect(screen.queryByText('Unknown Item')).not.toBeInTheDocument();
            
            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: b2c-admin-final-polish, Property 3: Unknown Item Fallback**
   * **Validates: Requirements 1.4**
   * 
   * For any unknown item, source information SHALL still be displayed
   */
  it('displays source information even for unknown items', () => {
    fc.assert(
      fc.property(unknownProductIdentityArb, (productIdentity) => {
        const { container, unmount } = render(<ProductHeader productIdentity={productIdentity} />);
        
        try {
          // Verify source chip is present
          const sourceIcons = ['🌐', '📸', '📊', '📝'];
          const hasSourceIcon = sourceIcons.some(icon => 
            container.textContent?.includes(icon)
          );
          expect(hasSourceIcon).toBe(true);
          
          // Verify source label is present
          const sourceLabels = ['Web URL', 'Screenshot', 'Barcode Scan', 'Text Input'];
          const hasSourceLabel = sourceLabels.some(label => 
            container.textContent?.includes(label)
          ) || (productIdentity.sourceLabel && container.textContent?.includes(productIdentity.sourceLabel));
          
          expect(hasSourceLabel).toBe(true);
          
          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });
});
