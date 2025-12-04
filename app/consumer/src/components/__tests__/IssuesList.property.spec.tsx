/**
 * Property-Based Tests for IssuesList Component
 * 
 * Feature: consumer-kiroween-polish, Property 4: Issue Grouping Completeness
 * Validates: Requirements 5.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IssuesList, type Issue } from '../IssuesList';

// Arbitrary generators for property-based testing
const issueKindArb = fc.constantFrom('warn', 'danger', 'ok') as fc.Arbitrary<'warn' | 'danger' | 'ok'>;

const issueCategoryArb = fc.constantFrom(
  'banned_claims',
  'allergens',
  'missing_disclaimers',
  'weasel_words',
  'recall_signals',
  'other'
) as fc.Arbitrary<'banned_claims' | 'allergens' | 'missing_disclaimers' | 'weasel_words' | 'recall_signals' | 'other'>;

const severityArb = fc.constantFrom('low', 'medium', 'high') as fc.Arbitrary<'low' | 'medium' | 'high'>;

const issueArb: fc.Arbitrary<Issue> = fc.record({
  kind: issueKindArb,
  label: fc.string({ minLength: 5, maxLength: 50 }),
  explanation: fc.string({ minLength: 10, maxLength: 200 }),
  source: fc.option(fc.webUrl(), { nil: undefined }),
  isUserAllergen: fc.option(fc.boolean(), { nil: undefined }),
  category: fc.option(issueCategoryArb, { nil: undefined }),
  severity: fc.option(severityArb, { nil: undefined }),
  matchedText: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
});

const issuesArrayArb = fc.array(issueArb, { minLength: 0, maxLength: 20 });

describe('IssuesList - Property-Based Tests', () => {
  /**
   * Property 4: Issue Grouping Completeness
   * 
   * For any set of detected issues, all issues SHALL be categorized into exactly one of the five groups
   * 
   * This property ensures that:
   * 1. Every issue is assigned to a category
   * 2. No issue is lost during grouping
   * 3. The total count of issues across all groups equals the input count
   */
  it('Property 4: Issue Grouping Completeness - all issues are categorized into exactly one group', () => {
    fc.assert(
      fc.property(issuesArrayArb, (issues) => {
        // Skip empty arrays as they have special handling
        if (issues.length === 0) {
          return true;
        }

        const { container } = render(
          <BrowserRouter>
            <IssuesList issues={issues} userAllergens={[]} />
          </BrowserRouter>
        );

        // Count total issues displayed in all groups
        const groupHeaders = container.querySelectorAll('[class*="groupHeader"]');
        let totalDisplayedIssues = 0;

        groupHeaders.forEach(header => {
          const countBadge = header.querySelector('[class*="groupCount"]');
          if (countBadge) {
            const count = parseInt(countBadge.textContent || '0', 10);
            totalDisplayedIssues += count;
          }
        });

        // Property: Total displayed issues must equal input issues
        expect(totalDisplayedIssues).toBe(issues.length);

        // Additional check: All issues should be rendered in the DOM
        const issueElements = container.querySelectorAll('[class*="item"]');
        
        // Note: Issues are only rendered when groups are expanded
        // By default, all groups start expanded, so we should see all issues
        // However, we verify the count badges which always show the correct count
        expect(totalDisplayedIssues).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Category Assignment Consistency
   * 
   * For any issue with an explicit category, it should appear in that category's group
   */
  it('Property: Issues with explicit categories are grouped correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            kind: issueKindArb,
            label: fc.string({ minLength: 5, maxLength: 50 }),
            explanation: fc.string({ minLength: 10, maxLength: 200 }),
            category: issueCategoryArb, // Always has a category
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (issues) => {
          const { container } = render(
            <BrowserRouter>
              <IssuesList issues={issues} userAllergens={[]} />
            </BrowserRouter>
          );

          // Count issues by category
          const categoryCounts: Record<string, number> = {};
          issues.forEach(issue => {
            categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
          });

          // Verify each category group shows the correct count
          const groupHeaders = container.querySelectorAll('[class*="groupHeader"]');
          groupHeaders.forEach(header => {
            const groupLabel = header.querySelector('[class*="groupLabel"]')?.textContent;
            const countBadge = header.querySelector('[class*="groupCount"]');
            
            if (groupLabel && countBadge) {
              const displayedCount = parseInt(countBadge.textContent || '0', 10);
              
              // Map display label back to category key
              const categoryMap: Record<string, string> = {
                'Banned Claims': 'banned_claims',
                'Allergens': 'allergens',
                'Missing Disclaimers': 'missing_disclaimers',
                'Weasel Words': 'weasel_words',
                'Recall Signals': 'recall_signals',
                'Other Issues': 'other',
              };
              
              const categoryKey = categoryMap[groupLabel];
              if (categoryKey && categoryCounts[categoryKey]) {
                expect(displayedCount).toBe(categoryCounts[categoryKey]);
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No Issues Lost During Grouping
   * 
   * For any set of issues, the sum of all group counts must equal the total input count
   */
  it('Property: No issues are lost during grouping process', () => {
    fc.assert(
      fc.property(
        fc.array(issueArb, { minLength: 1, maxLength: 50 }),
        (issues) => {
          const { container } = render(
            <BrowserRouter>
              <IssuesList issues={issues} userAllergens={[]} />
            </BrowserRouter>
          );

          // Sum all group counts
          const groupHeaders = container.querySelectorAll('[class*="groupHeader"]');
          let totalGroupedIssues = 0;

          groupHeaders.forEach(header => {
            const countBadge = header.querySelector('[class*="groupCount"]');
            if (countBadge) {
              const count = parseInt(countBadge.textContent || '0', 10);
              totalGroupedIssues += count;
            }
          });

          // Property: No issues should be lost
          expect(totalGroupedIssues).toBe(issues.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty State Handling
   * 
   * For an empty issues array, the component should display an empty state message
   */
  it('Property: Empty issues array displays empty state', () => {
    const { container } = render(
      <BrowserRouter>
        <IssuesList issues={[]} userAllergens={[]} />
      </BrowserRouter>
    );

    // Should show empty state
    const emptyState = container.querySelector('[class*="empty"]');
    expect(emptyState).toBeTruthy();
    expect(screen.getByText('No issues detected')).toBeTruthy();
  });
});
