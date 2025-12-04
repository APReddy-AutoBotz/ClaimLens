import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import * as fc from 'fast-check';
import Dashboard from '../pages/Dashboard';
import AuditViewer from '../pages/AuditViewer';
import ProfilesEditor from '../pages/ProfilesEditor';
import RulePacksEditor from '../pages/RulePacksEditor';
import { api } from '../api';

/**
 * Feature: b2c-admin-final-polish, Property 6: Page Non-Blankness
 * Validates: Requirements 3.4
 * 
 * Property: For any admin page load, the page SHALL render either data rows OR 
 * an empty state with title and description
 */

vi.mock('../api');

describe('Property 6: Page Non-Blankness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Dashboard always renders title and description or data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasData: fc.boolean(),
          hasError: fc.boolean(),
          isLoading: fc.boolean(),
        }),
        async ({ hasData, hasError, isLoading }) => {
          // Setup mock based on state
          if (isLoading) {
            vi.mocked(api.getDashboard).mockImplementation(() => new Promise(() => {}));
          } else if (hasError) {
            vi.mocked(api.getDashboard).mockRejectedValue(new Error('Test error'));
          } else if (hasData) {
            vi.mocked(api.getDashboard).mockResolvedValue({
              total_audits: 100,
              flagged_items: 10,
              avg_processing_time: 150,
              degraded_services: [],
              recent_audits: [{
                audit_id: 'test_1',
                ts: new Date().toISOString(),
                tenant: 'tenant_1',
                profile: 'Default',
                route: '/test',
                item_id: 'item_1',
                item_name: 'Test Item',
                transforms: [],
                verdict: {
                  verdict: 'allow' as const,
                  changes: [],
                  reasons: [],
                  audit_id: 'test_1',
                  correlation_id: 'corr_1'
                },
                latency_ms: 100,
                degraded_mode: false
              }]
            });
          } else {
            vi.mocked(api.getDashboard).mockResolvedValue({
              total_audits: 0,
              flagged_items: 0,
              avg_processing_time: 0,
              degraded_services: [],
              recent_audits: []
            });
          }

          const { container, unmount } = render(
            <BrowserRouter>
              <Dashboard />
            </BrowserRouter>
          );

          try {
            // Wait for any async operations
            await waitFor(() => {
              expect(container.firstChild).toBeTruthy();
            }, { timeout: 1000 });

            // Property: Page must have title
            const headings = container.querySelectorAll('h1');
            expect(headings.length).toBeGreaterThan(0);
            const heading = headings[0];
            expect(heading.textContent).toBeTruthy();
            expect(heading.textContent!.length).toBeGreaterThan(0);

            // Property: Page must have either data OR empty state with description
            const hasTable = container.querySelector('table');
            const hasEmptyState = container.querySelector('.empty-state');
            const hasLoadingState = container.textContent?.includes('Loading') || container.textContent?.includes('Consulting the ledger');
            const hasErrorState = container.textContent?.includes('Error');

            // At least one of these must be present
            const hasContent = hasTable || hasEmptyState || hasLoadingState || hasErrorState;
            expect(hasContent).toBeTruthy();

            // If empty state is shown, it must have title and description
            if (hasEmptyState) {
              const emptyStateText = hasEmptyState.textContent;
              expect(emptyStateText).toBeTruthy();
              expect(emptyStateText!.length).toBeGreaterThan(10); // Must have meaningful content
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('AuditViewer always renders title and description or data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasData: fc.boolean(),
          hasError: fc.boolean(),
        }),
        async ({ hasData, hasError }) => {
          // Setup mock based on state
          if (hasError) {
            vi.mocked(api.getAudit).mockRejectedValue(new Error('Audit not found'));
          } else if (hasData) {
            vi.mocked(api.getAudit).mockResolvedValue({
              audit_id: 'test_1',
              ts: new Date().toISOString(),
              tenant: 'tenant_1',
              profile: 'Default',
              route: '/test',
              item_id: 'item_1',
              item_name: 'Test Item',
              transforms: [],
              verdict: {
                verdict: 'allow' as const,
                changes: [],
                reasons: [],
                audit_id: 'test_1',
                correlation_id: 'corr_1'
              },
              latency_ms: 100,
              degraded_mode: false,
              before_content: 'Before',
              after_content: 'After'
            });
          } else {
            vi.mocked(api.getAudit).mockResolvedValue(null as any);
          }

          const { container, unmount } = render(
            <MemoryRouter initialEntries={['/audit/test_audit_123']}>
              <Routes>
                <Route path="/audit/:id" element={<AuditViewer />} />
              </Routes>
            </MemoryRouter>
          );

          try {
            // Wait for loading to complete and content to render
            await waitFor(() => {
              const loadingText = container.textContent?.includes('Loading');
              expect(loadingText).toBe(false);
            }, { timeout: 2000 });

            // Property: Page must have title
            const headings = container.querySelectorAll('h1');
            expect(headings.length).toBeGreaterThan(0);
            const heading = headings[0];
            expect(heading.textContent).toBeTruthy();
            expect(heading.textContent!.length).toBeGreaterThan(0);

            // Property: Page must have either data OR empty state with description
            const hasMetadata = container.querySelector('.metric-row');
            const hasEmptyState = container.querySelector('.empty-state');

            // At least one of these must be present
            const hasContent = hasMetadata || hasEmptyState;
            expect(hasContent).toBeTruthy();

            // If empty state is shown, it must have title and description
            if (hasEmptyState) {
              const emptyStateText = hasEmptyState.textContent;
              expect(emptyStateText).toBeTruthy();
              expect(emptyStateText!.length).toBeGreaterThan(10);
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('ProfilesEditor always renders title and description or data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasData: fc.boolean(),
          hasError: fc.boolean(),
          isLoading: fc.boolean(),
        }),
        async ({ hasData, hasError, isLoading }) => {
          // Setup mock based on state
          if (isLoading) {
            vi.mocked(api.getProfiles).mockImplementation(() => new Promise(() => {}));
          } else if (hasError) {
            vi.mocked(api.getProfiles).mockRejectedValue(new Error('Failed to load profiles'));
          } else if (hasData) {
            vi.mocked(api.getProfiles).mockResolvedValue([{
              name: 'Default',
              routes: [{
                path: '/test',
                transforms: ['transform1'],
                thresholds: { max: 100 },
                latency_budget_ms: 200
              }]
            }]);
          } else {
            vi.mocked(api.getProfiles).mockResolvedValue([]);
          }

          const { container, unmount } = render(
            <BrowserRouter>
              <ProfilesEditor />
            </BrowserRouter>
          );

          try {
            // Wait for any async operations
            await waitFor(() => {
              expect(container.firstChild).toBeTruthy();
            }, { timeout: 1000 });

            // Property: Page must have title
            const headings = container.querySelectorAll('h1');
            expect(headings.length).toBeGreaterThan(0);
            const heading = headings[0];
            expect(heading.textContent).toBeTruthy();
            expect(heading.textContent!.length).toBeGreaterThan(0);

            // Property: Page must have either data OR empty state
            const hasCard = container.querySelector('.card');
            expect(hasCard).toBeTruthy();

            const hasEmptyState = container.querySelector('.empty-state');
            const hasProfileData = container.textContent?.includes('Default');
            const hasLoadingState = container.textContent?.includes('Loading');

            // At least one of these must be present
            const hasContent = hasEmptyState || hasProfileData || hasLoadingState;
            expect(hasContent).toBeTruthy();

            // If empty state is shown, it must have title and description
            if (hasEmptyState) {
              const emptyStateText = hasEmptyState.textContent;
              expect(emptyStateText).toBeTruthy();
              expect(emptyStateText!.length).toBeGreaterThan(10);
            }
            
            // If no data, must have description
            if (!hasProfileData && !isLoading) {
              const description = container.querySelector('p');
              expect(description).toBeInTheDocument();
              expect(description!.textContent).toBeTruthy();
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('RulePacksEditor always renders title and description or data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasData: fc.boolean(),
          hasError: fc.boolean(),
          isLoading: fc.boolean(),
        }),
        async ({ hasData, hasError, isLoading }) => {
          // Setup mock based on state
          if (isLoading) {
            vi.mocked(api.getRulePacks).mockImplementation(() => new Promise(() => {}));
          } else if (hasError) {
            vi.mocked(api.getRulePacks).mockRejectedValue(new Error('Failed to load rule packs'));
          } else if (hasData) {
            vi.mocked(api.getRulePacks).mockResolvedValue([{
              name: 'allergens.in',
              version: '1.0.0',
              content: 'test content',
              updated_at: new Date().toISOString(),
              updated_by: 'admin'
            }]);
          } else {
            vi.mocked(api.getRulePacks).mockResolvedValue([]);
          }

          const { container, unmount } = render(
            <BrowserRouter>
              <RulePacksEditor />
            </BrowserRouter>
          );

          try {
            // Wait for any async operations
            await waitFor(() => {
              expect(container.firstChild).toBeTruthy();
            }, { timeout: 1000 });

            // Property: Page must have title
            const headings = container.querySelectorAll('h1');
            expect(headings.length).toBeGreaterThan(0);
            const heading = headings[0];
            expect(heading.textContent).toBeTruthy();
            expect(heading.textContent!.length).toBeGreaterThan(0);

            // Property: Page must have either data OR empty state
            const hasCard = container.querySelector('.card');
            expect(hasCard).toBeTruthy();

            const hasEmptyState = container.querySelector('.empty-state');
            const hasRulePackData = container.textContent?.includes('allergens.in');
            const hasLoadingState = container.textContent?.includes('Loading');

            // At least one of these must be present
            const hasContent = hasEmptyState || hasRulePackData || hasLoadingState;
            expect(hasContent).toBeTruthy();

            // If empty state is shown, it must have title and description
            if (hasEmptyState) {
              const emptyStateText = hasEmptyState.textContent;
              expect(emptyStateText).toBeTruthy();
              expect(emptyStateText!.length).toBeGreaterThan(10);
            }
            
            // If no data, must have description
            if (!hasRulePackData && !isLoading) {
              const description = container.querySelector('p');
              expect(description).toBeInTheDocument();
              expect(description!.textContent).toBeTruthy();
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Empty states always have meaningful content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Dashboard', 'AuditViewer', 'ProfilesEditor', 'RulePacksEditor'),
        async (pageName) => {
          // Setup mocks to return empty data
          vi.mocked(api.getDashboard).mockResolvedValue({
            total_audits: 0,
            flagged_items: 0,
            avg_processing_time: 0,
            degraded_services: [],
            recent_audits: []
          });
          vi.mocked(api.getAudit).mockResolvedValue(null as any);
          vi.mocked(api.getProfiles).mockResolvedValue([]);
          vi.mocked(api.getRulePacks).mockResolvedValue([]);

          let Component;
          switch (pageName) {
            case 'Dashboard':
              Component = Dashboard;
              break;
            case 'AuditViewer':
              Component = AuditViewer;
              break;
            case 'ProfilesEditor':
              Component = ProfilesEditor;
              break;
            case 'RulePacksEditor':
              Component = RulePacksEditor;
              break;
            default:
              throw new Error('Unknown page');
          }

          const { container, unmount } = render(
            <BrowserRouter>
              <Component />
            </BrowserRouter>
          );

          try {
            // Wait for rendering
            await waitFor(() => {
              expect(container.firstChild).toBeTruthy();
            }, { timeout: 1000 });

            // Check for empty state
            const emptyState = container.querySelector('.empty-state');
            if (emptyState) {
              const text = emptyState.textContent || '';
              
              // Property: Empty state must have meaningful content (more than just whitespace)
              expect(text.trim().length).toBeGreaterThan(10);
              
              // Property: Empty state should have a title (typically in larger text)
              const hasTitle = text.includes('No') || text.includes('Loading') || text.includes('Error');
              expect(hasTitle).toBe(true);
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
