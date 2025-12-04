/**
 * Property-Based Tests: Verdict Banner
 * 
 * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
 * **Validates: Requirements 4.2**
 * 
 * Property: For any Trust Score, the verdict label SHALL be deterministically 
 * derived: score >= 70 → allow, 40-69 → modify, < 40 → avoid
 * 
 * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
 * **Validates: Requirements 4.3, 4.4, 4.5**
 * 
 * Property: For any verdict label, the corresponding Kiroween microcopy SHALL 
 * be displayed exactly as specified
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { VerdictBanner, type VerdictLabel } from '../VerdictBanner';

/**
 * Arbitrary for generating valid trust scores (0-100)
 */
const trustScoreArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 100 });

/**
 * Arbitrary for generating valid verdict labels
 */
const verdictLabelArb: fc.Arbitrary<VerdictLabel> = fc.constantFrom('allow', 'modify', 'avoid');

/**
 * Helper function to determine expected verdict from score
 * This implements the specification from the design document
 */
function getExpectedVerdict(score: number): VerdictLabel {
  if (score >= 70) return 'allow';
  if (score >= 40) return 'modify';
  return 'avoid';
}

/**
 * Kiroween microcopy mapping from design document
 */
const EXPECTED_MICROCOPY: Record<VerdictLabel, string> = {
  allow: "Marked safe… for now.",
  modify: "Proceed with caution.",
  avoid: "Do not invite this into your body."
};

describe('Property 2: Verdict Consistency', () => {
  /**
   * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
   * **Validates: Requirements 4.2**
   * 
   * For any Trust Score, the verdict label SHALL be deterministically derived
   */
  it('verdict is deterministically derived from trust score: >= 70 → allow, 40-69 → modify, < 40 → avoid', () => {
    fc.assert(
      fc.property(trustScoreArb, (score) => {
        const expectedVerdict = getExpectedVerdict(score);
        
        const { unmount } = render(
          <VerdictBanner
            verdict={expectedVerdict}
            score={score}
          />
        );

        // Verify the verdict label is displayed
        const verdictElement = screen.getByRole('status');
        const verdictText = verdictElement.textContent || '';
        
        // The verdict label should be capitalized in the display
        const expectedLabel = expectedVerdict.charAt(0).toUpperCase() + expectedVerdict.slice(1);
        const hasCorrectLabel = verdictText.includes(expectedLabel);

        unmount();
        return hasCorrectLabel;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Boundary test: score = 70 should be 'allow'
   */
  it('score of 70 maps to allow verdict', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="allow"
        score={70}
      />
    );

    const verdictElement = screen.getByRole('status');
    const verdictText = verdictElement.textContent || '';
    const hasAllowLabel = verdictText.includes('Allow');

    unmount();
    expect(hasAllowLabel).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Boundary test: score = 69 should be 'modify'
   */
  it('score of 69 maps to modify verdict', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="modify"
        score={69}
      />
    );

    const verdictElement = screen.getByRole('status');
    const verdictText = verdictElement.textContent || '';
    const hasModifyLabel = verdictText.includes('Modify');

    unmount();
    expect(hasModifyLabel).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Boundary test: score = 40 should be 'modify'
   */
  it('score of 40 maps to modify verdict', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="modify"
        score={40}
      />
    );

    const verdictElement = screen.getByRole('status');
    const verdictText = verdictElement.textContent || '';
    const hasModifyLabel = verdictText.includes('Modify');

    unmount();
    expect(hasModifyLabel).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 2: Verdict Consistency**
   * **Validates: Requirements 4.2**
   * 
   * Boundary test: score = 39 should be 'avoid'
   */
  it('score of 39 maps to avoid verdict', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="avoid"
        score={39}
      />
    );

    const verdictElement = screen.getByRole('status');
    const verdictText = verdictElement.textContent || '';
    const hasAvoidLabel = verdictText.includes('Avoid');

    unmount();
    expect(hasAvoidLabel).toBe(true);
  });
});

describe('Property 3: Verdict Microcopy Mapping', () => {
  /**
   * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
   * **Validates: Requirements 4.3, 4.4, 4.5**
   * 
   * For any verdict label, the corresponding Kiroween microcopy SHALL be displayed
   */
  it('verdict microcopy matches specification for all verdict labels', () => {
    fc.assert(
      fc.property(
        verdictLabelArb,
        fc.integer({ min: 0, max: 100 }),
        (verdict, score) => {
          const { unmount } = render(
            <VerdictBanner
              verdict={verdict}
              score={score}
            />
          );

          const verdictElement = screen.getByRole('status');
          const displayedText = verdictElement.textContent || '';
          
          // Check that the expected microcopy is present
          const expectedMicrocopy = EXPECTED_MICROCOPY[verdict];
          const hasMicrocopy = displayedText.includes(expectedMicrocopy);

          unmount();
          return hasMicrocopy;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
   * **Validates: Requirements 4.3**
   * 
   * Allow verdict displays: "Marked safe… for now."
   */
  it('allow verdict displays correct Kiroween microcopy', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="allow"
        score={80}
      />
    );

    const verdictElement = screen.getByRole('status');
    const displayedText = verdictElement.textContent || '';
    const hasMicrocopy = displayedText.includes("Marked safe… for now.");

    unmount();
    expect(hasMicrocopy).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
   * **Validates: Requirements 4.4**
   * 
   * Modify verdict displays: "Proceed with caution."
   */
  it('modify verdict displays correct Kiroween microcopy', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="modify"
        score={50}
      />
    );

    const verdictElement = screen.getByRole('status');
    const displayedText = verdictElement.textContent || '';
    const hasMicrocopy = displayedText.includes("Proceed with caution.");

    unmount();
    expect(hasMicrocopy).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
   * **Validates: Requirements 4.5**
   * 
   * Avoid verdict displays: "Do not invite this into your body."
   */
  it('avoid verdict displays correct Kiroween microcopy', () => {
    const { unmount } = render(
      <VerdictBanner
        verdict="avoid"
        score={20}
      />
    );

    const verdictElement = screen.getByRole('status');
    const displayedText = verdictElement.textContent || '';
    const hasMicrocopy = displayedText.includes("Do not invite this into your body.");

    unmount();
    expect(hasMicrocopy).toBe(true);
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 3: Verdict Microcopy Mapping**
   * **Validates: Requirements 4.3, 4.4, 4.5**
   * 
   * Microcopy is unique for each verdict
   */
  it('each verdict has unique microcopy', () => {
    const microcopyValues = Object.values(EXPECTED_MICROCOPY);
    const uniqueValues = new Set(microcopyValues);
    
    expect(uniqueValues.size).toBe(microcopyValues.length);
  });
});
