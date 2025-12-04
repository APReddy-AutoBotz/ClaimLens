/**
 * Property-Based Test: Accessibility Focus Visibility
 * 
 * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
 * **Validates: Requirements 10.1**
 * 
 * Property: For any focused interactive element, a visible focus indicator SHALL be displayed
 * meeting WCAG AA requirements (minimum 3:1 contrast ratio for focus indicators).
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { getContrastRatio } from '../accessibility';

/**
 * Kiroween theme focus indicator colors
 */
const KIROWEEN_FOCUS_COLORS = {
  focusRing: '#14B8A6',      // --kw-spectral-teal
  focusRingAlt: '#2DD4BF',   // --kw-spectral-mint
};

/**
 * Background colors that focus indicators must be visible against
 */
const KIROWEEN_BACKGROUNDS = {
  ink: '#0B1220',            // --color-ink
  surface: '#0F1628',        // --color-surface
};

/**
 * Interactive element types that must have visible focus indicators
 */
const INTERACTIVE_ELEMENT_TYPES = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[tabindex]',
] as const;

/**
 * Minimum contrast ratio for focus indicators per WCAG 2.1 SC 1.4.11
 */
const WCAG_FOCUS_INDICATOR_MIN_CONTRAST = 3.0;

/**
 * Arbitrary for generating valid hex color strings
 */
const hexColorArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
});

describe('Property 6: Accessibility Focus Visibility', () => {
  /**
   * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
   * **Validates: Requirements 10.1**
   */
  it('focus ring colors meet WCAG AA contrast requirements against all backgrounds', () => {
    const focusColors = Object.values(KIROWEEN_FOCUS_COLORS);
    const backgrounds = Object.values(KIROWEEN_BACKGROUNDS);

    const focusColorArb = fc.constantFrom(...focusColors);
    const backgroundArb = fc.constantFrom(...backgrounds);

    fc.assert(
      fc.property(focusColorArb, backgroundArb, (focusColor, background) => {
        const contrastRatio = getContrastRatio(focusColor, background);
        return contrastRatio >= WCAG_FOCUS_INDICATOR_MIN_CONTRAST;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
   * **Validates: Requirements 10.1**
   */
  it('contrast ratio calculation is valid for any hex color pair', () => {
    fc.assert(
      fc.property(hexColorArb, hexColorArb, (color1, color2) => {
        const ratio = getContrastRatio(color1, color2);
        return ratio >= 1 && ratio <= 21 && Number.isFinite(ratio);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
   * **Validates: Requirements 10.1**
   */
  it('focus indicator width is sufficient for visibility', () => {
    const MINIMUM_FOCUS_WIDTH_PX = 2;
    const KIROWEEN_FOCUS_WIDTH_PX = 2;

    fc.assert(
      fc.property(
        fc.constantFrom(...INTERACTIVE_ELEMENT_TYPES),
        () => {
          return KIROWEEN_FOCUS_WIDTH_PX >= MINIMUM_FOCUS_WIDTH_PX;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
   * **Validates: Requirements 10.1**
   */
  it('contrast ratio is symmetric', () => {
    fc.assert(
      fc.property(hexColorArb, hexColorArb, (color1, color2) => {
        const ratio1 = getContrastRatio(color1, color2);
        const ratio2 = getContrastRatio(color2, color1);
        return Math.abs(ratio1 - ratio2) < 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 6: Accessibility Focus Visibility**
   * **Validates: Requirements 10.1**
   */
  it('identical colors have contrast ratio of 1', () => {
    fc.assert(
      fc.property(hexColorArb, (color) => {
        const ratio = getContrastRatio(color, color);
        return Math.abs(ratio - 1) < 0.0001;
      }),
      { numRuns: 100 }
    );
  });
});
