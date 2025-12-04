import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuditViewer from '../pages/AuditViewer';
import { api } from '../api';

vi.mock('../api');

const mockAudit = {
  audit_id: 'aud_test_123',
  ts: '2025-11-02T10:30:00Z',
  tenant: 'tenant_1',
  profile: 'menushield_in',
  route: '/v1/menu/feed',
  item_id: 'item_1',
  item_name: 'Spicy Paneer Wrap',
  transforms: [
    { name: 'detect.allergens', duration_ms: 45, decision: 'flag' as const },
    { name: 'rewrite.disclaimer', duration_ms: 30, decision: 'modify' as const },
    { name: 'redact.pii', duration_ms: 25, decision: 'pass' as const }
  ],
  verdict: {
    verdict: 'modify' as const,
    changes: [
      { field: 'description', before: 'Contains dairy', after: 'Contains dairy (milk, paneer)' }
    ],
    reasons: [
      { transform: 'detect.allergens', why: 'Detected allergen: dairy', source: 'https://fssai.gov.in/allergens' },
      { transform: 'rewrite.disclaimer', why: 'Added specific allergen names for clarity' }
    ],
    audit_id: 'aud_test_123',
    correlation_id: 'corr_123'
  },
  latency_ms: 100,
  degraded_mode: false,
  before_content: 'Spicy paneer wrap with vegetables. Contains dairy.',
  after_content: 'Spicy paneer wrap with vegetables. Contains dairy (milk, paneer).'
};

describe('AuditViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (auditId: string) => {
    return render(
      <MemoryRouter initialEntries={[`/audits/${auditId}`]}>
        <Routes>
          <Route path="/audits/:id" element={<AuditViewer />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(api.getAudit).mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter('aud_test_123');

    expect(screen.getByText('Loading audit record...')).toBeInTheDocument();
  });

  it('renders audit details after loading', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Audit Details')).toBeInTheDocument();
      expect(screen.getByText('aud_test_123')).toBeInTheDocument();
      expect(screen.getByText('Spicy Paneer Wrap')).toBeInTheDocument();
    });
  });

  it('displays before/after content side-by-side', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Content Comparison')).toBeInTheDocument();
      expect(screen.getAllByText('Before').length).toBeGreaterThan(0);
      expect(screen.getAllByText('After').length).toBeGreaterThan(0);
      expect(screen.getByText(/Spicy paneer wrap with vegetables\. Contains dairy\./)).toBeInTheDocument();
    });
  });

  it('displays changes table', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('Contains dairy')).toBeInTheDocument();
      expect(screen.getByText('Contains dairy (milk, paneer)')).toBeInTheDocument();
    });
  });

  it('displays reasons with sources', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Reasons')).toBeInTheDocument();
      expect(screen.getAllByText('detect.allergens').length).toBeGreaterThan(0);
      expect(screen.getByText('Detected allergen: dairy')).toBeInTheDocument();
      
      const sourceLink = screen.getByRole('link', { name: /View source for detect.allergens/i });
      expect(sourceLink).toHaveAttribute('href', 'https://fssai.gov.in/allergens');
      expect(sourceLink).toHaveAttribute('target', '_blank');
    });
  });

  it('displays performance metrics', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getAllByText('detect.allergens').length).toBeGreaterThan(0);
      expect(screen.getByText('45ms')).toBeInTheDocument();
      expect(screen.getByText('Total Latency')).toBeInTheDocument();
      // Use getAllByText since "100ms" appears twice (Latency field and Total Latency)
      expect(screen.getAllByText('100ms').length).toBeGreaterThan(0);
    });
  });

  it('shows degraded services when applicable', async () => {
    const degradedAudit = {
      ...mockAudit,
      degraded_mode: true,
      degraded_services: ['ocr', 'recall']
    };
    vi.mocked(api.getAudit).mockResolvedValue(degradedAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('ocr, recall')).toBeInTheDocument();
    });
  });

  it('downloads JSON when button clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Audit Details')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download audit as JSON/i });
    expect(downloadButton).toBeInTheDocument();
    
    // Click the button - download mocks are in setup.ts
    await user.click(downloadButton);
  });

  it('downloads Markdown when button clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText('Audit Details')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download audit as Markdown/i });
    expect(downloadButton).toBeInTheDocument();
    
    // Click the button - download mocks are in setup.ts
    await user.click(downloadButton);
  });

  it('displays error message on API failure', async () => {
    vi.mocked(api.getAudit).mockRejectedValue(new Error('Audit not found'));

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      expect(screen.getByText(/No audits found/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit not found/i)).toBeInTheDocument();
    });
  });

  it('has back to dashboard link', async () => {
    vi.mocked(api.getAudit).mockResolvedValue(mockAudit);

    renderWithRouter('aud_test_123');

    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
      expect(backLink).toHaveAttribute('href', '/');
    });
  });
});
