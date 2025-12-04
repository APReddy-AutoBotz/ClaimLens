/**
 * Property-Based Test: Evidence Drawer Content
 * 
 * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
 * **Validates: Requirements 6.2, 6.3, 6.4**
 * 
 * Property: For any expanded evidence drawer, all three required sections 
 * (rules, matched text, policy refs) SHALL be present
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  EvidenceDrawer, 
  type RuleFired, 
  type MatchedSnippet, 
  type PolicyReference,
  type TransformStep 
} from '../EvidenceDrawer';

/**
 * Arbitrary for generating valid RuleFired objects
 */
const ruleFiredArb: fc.Arbitrary<RuleFired> = fc.record({
  id: fc.stringMatching(/^[a-z0-9-]{3,20}$/),
  name: fc.stringMatching(/^[A-Za-z0-9 ]{5,50}$/),
  description: fc.stringMatching(/^[A-Za-z0-9 .,]{10,200}$/),
  severity: fc.constantFrom('info', 'warn', 'danger') as fc.Arbitrary<'info' | 'warn' | 'danger'>,
});

/**
 * Arbitrary for generating valid MatchedSnippet objects
 */
const matchedSnippetArb: fc.Arbitrary<MatchedSnippet> = fc.stringMatching(/^[A-Za-z0-9 .,]{15,100}$/)
  .chain(text => {
    const maxStart = Math.max(0, text.length - 5);
    return fc.tuple(
      fc.constant(text),
      fc.integer({ min: 0, max: maxStart }),
    ).chain(([t, start]) => {
      const maxEnd = Math.min(t.length, start + 20);
      const minEnd = Math.min(t.length, start + 1);
      return fc.tuple(
        fc.constant(t),
        fc.constant(start),
        fc.integer({ min: minEnd, max: maxEnd }),
      );
    });
  })
  .chain(([text, start, end]) => 
    fc.record({
      text: fc.constant(text),
      highlight: fc.constant([start, end] as [number, number]),
      rule: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
      sourceUrl: fc.option(fc.webUrl(), { nil: undefined }),
    })
  );

/**
 * Arbitrary for generating valid PolicyReference objects
 */
const policyReferenceArb: fc.Arbitrary<PolicyReference> = fc.record({
  packName: fc.stringMatching(/^[a-z-]{5,30}$/),
  packVersion: fc.stringMatching(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  ruleId: fc.stringMatching(/^[a-z0-9-]{3,20}$/),
  description: fc.stringMatching(/^[A-Za-z0-9 .,]{10,200}$/),
});

/**
 * Arbitrary for generating valid TransformStep objects
 */
const transformStepArb: fc.Arbitrary<TransformStep> = fc.record({
  name: fc.stringMatching(/^[a-z.]{5,30}$/),
  duration_ms: fc.integer({ min: 0, max: 5000 }),
  status: fc.constantFrom('success', 'skipped', 'error') as fc.Arbitrary<'success' | 'skipped' | 'error'>,
});

/**
 * Arbitrary for generating complete EvidenceDrawer props
 */
const evidenceDrawerPropsArb = fc.record({
  correlationId: fc.option(fc.uuid(), { nil: undefined }),
  rules: fc.array(ruleFiredArb, { minLength: 0, maxLength: 5 }),
  matchedText: fc.array(matchedSnippetArb, { minLength: 0, maxLength: 5 }),
  policyRefs: fc.array(policyReferenceArb, { minLength: 0, maxLength: 5 }),
  transformChain: fc.array(transformStepArb, { minLength: 0, maxLength: 5 }),
  totalChecks: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
});

describe('Property 5: Evidence Drawer Content', () => {
  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.2, 6.3, 6.4**
   * 
   * For any expanded evidence drawer, all three required sections SHALL be present
   */
  it('expanded drawer contains all three required sections (rules, matched text, policy refs)', () => {
    fc.assert(
      fc.property(evidenceDrawerPropsArb, (props) => {
        const { unmount } = render(
          <EvidenceDrawer
            correlationId={props.correlationId}
            rules={props.rules}
            matchedText={props.matchedText}
            policyRefs={props.policyRefs}
            transformChain={props.transformChain}
            totalChecks={props.totalChecks}
          />
        );

        // Open the drawer
        const trigger = screen.getByRole('button', { name: /receipts/i });
        fireEvent.click(trigger);

        // Verify all three required sections are present
        const rulesSection = screen.getByRole('button', { name: /rules fired/i });
        const matchedTextSection = screen.getByRole('button', { name: /matched text/i });
        const policyRefsSection = screen.getByRole('button', { name: /policy references/i });

        const sectionsPresent = 
          rulesSection !== null && 
          matchedTextSection !== null && 
          policyRefsSection !== null;

        unmount();
        return sectionsPresent;
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.2**
   * 
   * Rules section displays correct count
   */
  it('rules section displays correct count badge', () => {
    fc.assert(
      fc.property(
        fc.array(ruleFiredArb, { minLength: 0, maxLength: 5 }),
        (rules) => {
          const { unmount } = render(
            <EvidenceDrawer
              rules={rules}
              matchedText={[]}
              policyRefs={[]}
            />
          );

          // Open the drawer
          const trigger = screen.getByRole('button', { name: /receipts/i });
          fireEvent.click(trigger);

          // Find the rules section and verify count
          const rulesSection = screen.getByRole('button', { name: /rules fired/i });
          const countText = rulesSection.textContent || '';
          const hasCorrectCount = countText.includes(String(rules.length));

          unmount();
          return hasCorrectCount;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.3**
   * 
   * Matched text section displays correct count
   */
  it('matched text section displays correct count badge', () => {
    fc.assert(
      fc.property(
        fc.array(matchedSnippetArb, { minLength: 0, maxLength: 5 }),
        (matchedText) => {
          const { unmount } = render(
            <EvidenceDrawer
              rules={[]}
              matchedText={matchedText}
              policyRefs={[]}
            />
          );

          // Open the drawer
          const trigger = screen.getByRole('button', { name: /receipts/i });
          fireEvent.click(trigger);

          // Find the matched text section and verify count
          const matchedSection = screen.getByRole('button', { name: /matched text/i });
          const countText = matchedSection.textContent || '';
          const hasCorrectCount = countText.includes(String(matchedText.length));

          unmount();
          return hasCorrectCount;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.4**
   * 
   * Policy refs section displays correct count
   */
  it('policy refs section displays correct count badge', () => {
    fc.assert(
      fc.property(
        fc.array(policyReferenceArb, { minLength: 0, maxLength: 5 }),
        (policyRefs) => {
          const { unmount } = render(
            <EvidenceDrawer
              rules={[]}
              matchedText={[]}
              policyRefs={policyRefs}
            />
          );

          // Open the drawer
          const trigger = screen.getByRole('button', { name: /receipts/i });
          fireEvent.click(trigger);

          // Find the policy refs section and verify count
          const policySection = screen.getByRole('button', { name: /policy references/i });
          const countText = policySection.textContent || '';
          const hasCorrectCount = countText.includes(String(policyRefs.length));

          unmount();
          return hasCorrectCount;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.2, 6.3, 6.4**
   * 
   * When sections are expanded, content is displayed
   */
  it('expanded sections display their content', () => {
    fc.assert(
      fc.property(
        fc.record({
          rules: fc.array(ruleFiredArb, { minLength: 1, maxLength: 3 }),
          matchedText: fc.array(matchedSnippetArb, { minLength: 1, maxLength: 3 }),
          policyRefs: fc.array(policyReferenceArb, { minLength: 1, maxLength: 3 }),
        }),
        (props) => {
          const { unmount } = render(
            <EvidenceDrawer
              rules={props.rules}
              matchedText={props.matchedText}
              policyRefs={props.policyRefs}
            />
          );

          // Open the drawer
          const trigger = screen.getByRole('button', { name: /receipts/i });
          fireEvent.click(trigger);

          // Rules section is expanded by default, check first rule is visible
          const firstRuleName = props.rules[0].name.trim();
          // Look for the rule name in the rules list
          const rulesList = document.querySelector('[class*="rulesList"]');
          const ruleVisible = rulesList?.textContent?.includes(firstRuleName) ?? false;

          // Expand matched text section
          const matchedSection = screen.getByRole('button', { name: /matched text/i });
          fireEvent.click(matchedSection);
          
          // Check that matched text rule reference is visible (in the "Rule: xxx" format)
          const firstMatchedRule = props.matchedText[0].rule.trim();
          // Look for the rule in the matched list
          const matchedList = document.querySelector('[class*="matchedList"]');
          const matchedVisible = matchedList?.textContent?.includes(firstMatchedRule) ?? false;

          // Expand policy refs section
          const policySection = screen.getByRole('button', { name: /policy references/i });
          fireEvent.click(policySection);
          
          // Check that policy pack name is visible
          const firstPolicyName = props.policyRefs[0].packName.trim();
          // Look for the pack name in the policy list
          const policyList = document.querySelector('[class*="policyList"]');
          const policyVisible = policyList?.textContent?.includes(firstPolicyName) ?? false;

          unmount();
          return ruleVisible && matchedVisible && policyVisible;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 5: Evidence Drawer Content**
   * **Validates: Requirements 6.6**
   * 
   * Summary count is displayed when drawer is collapsed
   */
  it('summary count is displayed on collapsed trigger', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (totalChecks) => {
          const { unmount } = render(
            <EvidenceDrawer
              rules={[]}
              matchedText={[]}
              policyRefs={[]}
              totalChecks={totalChecks}
            />
          );

          // Drawer is collapsed by default
          const trigger = screen.getByRole('button', { name: /receipts/i });
          const triggerText = trigger.textContent || '';
          
          // Should show checks count - the badge shows "{n} checks"
          const hasChecksCount = triggerText.includes('checks');

          unmount();
          return hasChecksCount;
        }
      ),
      { numRuns: 20 }
    );
  });
});
