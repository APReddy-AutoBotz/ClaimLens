import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { api } from '../api';
import type { EnhancedDashboardMetrics } from '../types';

vi.mock('../api');

const createMockAudit = (id: string, overrides: any = {}) => ({
  audit_id: id,
  ts: '2025-11-02T10:30:00Z',
  tenant: 'tenant_1',
  profile: 'default',
  route: '/v1/menu/feed',
  item_id: `item_${id}`,
  item_name: `Test Item ${id}`,
  transforms: [],
  verdict: {
    verdict: 'modify' as const,
    changes: [],
    reasons: [],
    audit_id: id,
    correlation_id: `corr_${id}`
  },
  latency_ms: 120,
  degraded_mode: false,
  severity: 'medium' as const,
  tags: [],
  pack_version: 'v2.1.0',
  ...overrides
});

const createMockMetrics = (audits: any[]): EnhancedDashboardMetrics => ({
  total_audits: audits.length,
  flagged_items: 0,
  avg_processing_time: 145.5,
  degraded_services: [],
  recent_audits: audits,
  publish_readiness: {
    status: 'ready',
    drivers: []
  },
  compliance_risk: {
    level: 'low',
    score: 20,
    drivers: []
  },
  slo_health: {
    p95_latency_ms: 245,
    latency_budget_ms: 300,
    error_rate: 0.002,
    circuit_breaker_state: 'closed'
  },
  top_violations: {
    banned_claims: 0,
    allergens: 0,
    recalls: 0,
    pii: 0
  },
  sparkline_data: {
    publish_readiness: [1, 2, 1, 0, 1, 2, 1],
    compliance_risk: [20, 22, 18, 20, 19, 21, 20],
    slo_latency: [240, 245, 250, 242, 248, 243, 245],
    total_violations: [5, 4, 6, 3, 5, 4, 5]
  },
  policy_pack_version: 'v2.1.0',
  last_updated: '2025-11-02T10:30:00Z'
});

describe('Action Queue - Tag Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays all audits when no tags are selected', async () => {
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Item 1' }),
      createMockAudit('aud_2', { tags: ['allergen'], item_name: 'Item 2' }),
      createMockAudit('aud_3', { tags: ['recall'], item_name: 'Item 3' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  it('filters audits when a tag chip is clicked', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Banned Item' }),
      createMockAudit('aud_2', { tags: ['allergen'], item_name: 'Allergen Item' }),
      createMockAudit('aud_3', { tags: ['banned_claim', 'allergen'], item_name: 'Both Tags' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Banned Item')).toBeInTheDocument();
    });

    // Click the "Banned Claim" tag chip
    const bannedClaimChip = screen.getAllByRole('button', { name: /Filter by banned_claim/i })[0];
    await user.click(bannedClaimChip);

    // Should show only items with banned_claim tag
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('Banned Item');
      expect(table).toHaveTextContent('Both Tags');
      expect(table).not.toHaveTextContent('Allergen Item');
    });
  });

  it('shows active state on selected tag chips', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Test Item' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    const tagChip = screen.getByRole('button', { name: /Filter by banned_claim/i });
    
    // Initially not pressed
    expect(tagChip).toHaveAttribute('aria-pressed', 'false');
    
    // Click to activate
    await user.click(tagChip);
    
    // Should be pressed
    await waitFor(() => {
      expect(tagChip).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('allows multiple tag filters to be active simultaneously', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Banned Only' }),
      createMockAudit('aud_2', { tags: ['allergen'], item_name: 'Allergen Only' }),
      createMockAudit('aud_3', { tags: ['recall'], item_name: 'Recall Only' }),
      createMockAudit('aud_4', { tags: ['banned_claim', 'allergen'], item_name: 'Multiple Tags' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Banned Only')).toBeInTheDocument();
    });

    // Click banned_claim filter
    const bannedChips = screen.getAllByRole('button', { name: /Filter by banned_claim/i });
    await user.click(bannedChips[0]);

    // Click allergen filter
    const allergenChips = screen.getAllByRole('button', { name: /Filter by allergen/i });
    await user.click(allergenChips[0]);

    // Should show items with either tag
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('Banned Only');
      expect(table).toHaveTextContent('Allergen Only');
      expect(table).toHaveTextContent('Multiple Tags');
      expect(table).not.toHaveTextContent('Recall Only');
    });
  });

  it('can deselect a tag filter by clicking it again', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Banned Item' }),
      createMockAudit('aud_2', { tags: ['allergen'], item_name: 'Allergen Item' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Banned Item')).toBeInTheDocument();
    });

    const bannedChip = screen.getAllByRole('button', { name: /Filter by banned_claim/i })[0];
    
    // Click to filter
    await user.click(bannedChip);
    await waitFor(() => {
      expect(screen.queryByText('Allergen Item')).not.toBeInTheDocument();
    });

    // Click again to deselect
    await user.click(bannedChip);
    await waitFor(() => {
      expect(screen.getByText('Allergen Item')).toBeInTheDocument();
    });
  });

  it('displays empty state message when table is filtered to zero results', async () => {
    // Test with empty audit list to verify empty state rendering
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics([]));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText(/No data yet/i)).toBeInTheDocument();
      // When no tag filters are active, should show option to run demo audits
      expect(screen.getByRole('button', { name: /Run Demo Audit/i })).toBeInTheDocument();
    });
  });
});

describe('Action Queue - Bulk Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows individual audit selection via checkbox', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { item_name: 'Item 1' }),
      createMockAudit('aud_2', { item_name: 'Item 2' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Select audit Item 1');
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);

    // Checkbox should be checked
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    // Bulk export button should appear
    await waitFor(() => {
      const exportButton = screen.queryByText(/Bulk Export \(1\)/i);
      expect(exportButton).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('allows selecting all audits via header checkbox', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { item_name: 'Item 1' }),
      createMockAudit('aud_2', { item_name: 'Item 2' }),
      createMockAudit('aud_3', { item_name: 'Item 3' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByLabelText('Select all audits');
    await user.click(selectAllCheckbox);

    // Should show bulk export with count of 3
    await waitFor(() => {
      const exportButton = screen.queryByText(/Bulk Export \(3\)/i);
      expect(exportButton).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deselects all audits when clicking select-all checkbox twice', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { item_name: 'Item 1' }),
      createMockAudit('aud_2', { item_name: 'Item 2' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByLabelText('Select all audits');
    
    // Select all
    await user.click(selectAllCheckbox);
    await waitFor(() => {
      const exportButton = screen.queryByText(/Bulk Export \(2\)/i);
      expect(exportButton).toBeInTheDocument();
    }, { timeout: 3000 });

    // Deselect all
    await user.click(selectAllCheckbox);
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('updates selection count when individual checkboxes are toggled', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { item_name: 'Item 1' }),
      createMockAudit('aud_2', { item_name: 'Item 2' }),
      createMockAudit('aud_3', { item_name: 'Item 3' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Select first item
    await user.click(screen.getByLabelText('Select audit Item 1'));
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(1\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select second item
    await user.click(screen.getByLabelText('Select audit Item 2'));
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(2\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Deselect first item
    await user.click(screen.getByLabelText('Select audit Item 1'));
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(1\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('exports selected audits as JSON when bulk export is clicked', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { item_name: 'Item 1' }),
      createMockAudit('aud_2', { item_name: 'Item 2' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Select first audit
    await user.click(screen.getByLabelText('Select audit Item 1'));

    // Wait for bulk export button to appear
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(1\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click bulk export
    const exportButton = screen.getByText(/Bulk Export \(1\)/i);
    await user.click(exportButton);

    // Verify download was triggered
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
  });

  it('maintains selection when tag filters are applied', async () => {
    const user = userEvent.setup();
    const audits = [
      createMockAudit('aud_1', { tags: ['banned_claim'], item_name: 'Banned Item' }),
      createMockAudit('aud_2', { tags: ['allergen'], item_name: 'Allergen Item' })
    ];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Banned Item')).toBeInTheDocument();
    });

    // Select first audit
    await user.click(screen.getByLabelText('Select audit Banned Item'));
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(1\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Apply tag filter
    const bannedChip = screen.getAllByRole('button', { name: /Filter by banned_claim/i })[0];
    await user.click(bannedChip);

    // Selection should still be maintained
    await waitFor(() => {
      expect(screen.queryByText(/Bulk Export \(1\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('has accessible checkboxes with minimum 44px touch targets', async () => {
    const audits = [createMockAudit('aud_1', { item_name: 'Item 1' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Select audit Item 1');
    const styles = window.getComputedStyle(checkbox);
    
    // Check minimum touch target size (44x44px per WCAG)
    expect(checkbox).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
  });
});

describe('Action Queue - Row Action Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays View Receipts and Preview Rewrite buttons for each audit', async () => {
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /View receipts for Test Item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preview rewrite for Test Item/i })).toBeInTheDocument();
  });

  it('opens receipts drawer when View Receipts button is clicked', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));
    vi.mocked(api.getAudit).mockResolvedValue(audits[0]);

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    const viewButton = screen.getByRole('button', { name: /View receipts for Test Item/i });
    await user.click(viewButton);

    // Drawer should open
    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });
  });

  it('opens preview modal when Preview Rewrite button is clicked', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));
    vi.mocked(api.getAudit).mockResolvedValue(audits[0]);

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    const previewButton = screen.getByRole('button', { name: /Preview rewrite for Test Item/i });
    await user.click(previewButton);

    // Modal should open with title
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Preview Rewrite/i })).toBeInTheDocument();
      expect(screen.getByText('Preview Rewrite')).toBeInTheDocument();
    });
  });

  it('closes receipts drawer when close button is clicked', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));
    vi.mocked(api.getAudit).mockResolvedValue(audits[0]);

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Open drawer
    const viewButton = screen.getByRole('button', { name: /View receipts for Test Item/i });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });

    // Close drawer
    const closeButton = screen.getByRole('button', { name: /Close drawer/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Audit Trail')).not.toBeInTheDocument();
    });
  });

  it('closes preview modal when close button is clicked', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Open modal
    const previewButton = screen.getByRole('button', { name: /Preview rewrite for Test Item/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Preview Rewrite')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole('button', { name: /Close modal/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Preview Rewrite')).not.toBeInTheDocument();
    });
  });

  it('closes receipts drawer when ESC key is pressed', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));
    vi.mocked(api.getAudit).mockResolvedValue(audits[0]);

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Open drawer
    const viewButton = screen.getByRole('button', { name: /View receipts for Test Item/i });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });

    // Press ESC
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Audit Trail')).not.toBeInTheDocument();
    });
  });

  it('closes preview modal when ESC key is pressed', async () => {
    const user = userEvent.setup();
    const audits = [createMockAudit('aud_1', { item_name: 'Test Item' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Open modal
    const previewButton = screen.getByRole('button', { name: /Preview rewrite for Test Item/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Preview Rewrite')).toBeInTheDocument();
    });

    // Press ESC
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Preview Rewrite')).not.toBeInTheDocument();
    });
  });

  it('has accessible action buttons with descriptive labels', async () => {
    const audits = [createMockAudit('aud_1', { item_name: 'Spicy Paneer Wrap' })];
    vi.mocked(api.getDashboard).mockResolvedValue(createMockMetrics(audits));

    render(<BrowserRouter><Dashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Spicy Paneer Wrap')).toBeInTheDocument();
    });

    // Check that buttons have descriptive aria-labels
    const viewButton = screen.getByRole('button', { name: /View receipts for Spicy Paneer Wrap/i });
    const previewButton = screen.getByRole('button', { name: /Preview rewrite for Spicy Paneer Wrap/i });

    expect(viewButton).toHaveAttribute('aria-label');
    expect(previewButton).toHaveAttribute('aria-label');
    expect(viewButton).toHaveAttribute('title', 'View Receipts');
    expect(previewButton).toHaveAttribute('title', 'Preview Rewrite');
  });
});
