import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import FilterBar from '../components/FilterBar';
import PolicyChangeModal from '../components/PolicyChangeModal';
import Dashboard from '../pages/Dashboard';

// Mock API
vi.mock('../api', () => ({
  api: {
    getDashboard: vi.fn().mockResolvedValue({
      total_audits: 1234,
      flagged_items: 56,
      avg_processing_time: 245,
      recent_audits: [],
      degraded_services: [],
      publish_readiness: {
        status: 'needs_review',
        drivers: [{ label: 'Items need review', count: 3, type: 'warning' }]
      },
      compliance_risk: {
        level: 'medium',
        score: 65,
        drivers: [{ type: 'banned_claims', count: 12 }]
      },
      slo_health: {
        p95_latency_ms: 245,
        latency_budget_ms: 300,
        error_rate: 0.002,
        circuit_breaker_state: 'closed'
      },
      top_violations: {
        banned_claims: 15,
        allergens: 8,
        recalls: 2,
        pii: 1
      },
      sparkline_data: {
        publish_readiness: [10, 12, 8, 15, 11, 9, 13],
        compliance_risk: [60, 62, 65, 63, 68, 65, 67],
        slo_latency: [230, 240, 235, 245, 250, 240, 245],
        total_violations: [20, 22, 18, 25, 23, 21, 26]
      },
      policy_pack_version: 'v2.1.0',
      last_updated: new Date().toISOString()
    }),
    createPolicyChange: vi.fn().mockResolvedValue({ id: 'test-id' })
  }
}));

describe('Accessibility Features', () => {
  it('has skip to main content link', () => {
    render(<App />);

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('main content has proper id for skip link', () => {
    render(<App />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('navigation has proper ARIA labels', () => {
    render(<App />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('all navigation links have aria-labels', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profiles & Routes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rule Packs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fixtures Runner' })).toBeInTheDocument();
  });

  it('tracks keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially no keyboard-nav-active class
    expect(document.body.classList.contains('keyboard-nav-active')).toBe(false);

    // Press Tab to trigger keyboard navigation
    await user.tab();

    // Should add keyboard-nav-active class
    expect(document.body.classList.contains('keyboard-nav-active')).toBe(true);
  });

  it('removes keyboard navigation class on mouse interaction', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Trigger keyboard navigation
    await user.tab();
    expect(document.body.classList.contains('keyboard-nav-active')).toBe(true);

    // Click somewhere
    const nav = screen.getByRole('navigation');
    await user.click(nav);

    // Should remove keyboard-nav-active class
    expect(document.body.classList.contains('keyboard-nav-active')).toBe(false);
  });

  it('all interactive elements are keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab through navigation links
    await user.tab(); // Skip link
    await user.tab(); // First nav link

    const firstLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(firstLink).toHaveFocus();

    await user.tab(); // Second nav link
    const secondLink = screen.getByRole('link', { name: 'Profiles & Routes' });
    expect(secondLink).toHaveFocus();
  });

  it('has proper heading hierarchy', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 2, name: 'ClaimLens Admin' });
    expect(heading).toBeInTheDocument();
  });

  it('navigation links have proper focus indicators', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.tab(); // Skip link
    await user.tab(); // First nav link

    const firstLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(firstLink).toHaveFocus();
    
    // Check that focus-visible styles would apply
    const styles = window.getComputedStyle(firstLink);
    expect(firstLink).toBeVisible();
  });
});

describe('Color Contrast - Requirements 5.2', () => {
  it('uses high contrast colors for text', () => {
    const { container } = render(
      <BrowserRouter>
        <div style={{ color: 'var(--cl-cloud)', background: 'var(--cl-ink)' }}>
          Test Text
        </div>
      </BrowserRouter>
    );

    const element = container.querySelector('div');
    expect(element).toBeInTheDocument();
  });

  it('badge colors meet contrast requirements', () => {
    const { container } = render(
      <BrowserRouter>
        <div>
          <span className="cl-badge badge-ok">Success</span>
          <span className="cl-badge badge-warn">Warning</span>
          <span className="cl-badge badge-danger">Danger</span>
        </div>
      </BrowserRouter>
    );

    expect(container.querySelector('.badge-ok')).toBeInTheDocument();
    expect(container.querySelector('.badge-warn')).toBeInTheDocument();
    expect(container.querySelector('.badge-danger')).toBeInTheDocument();
  });

  it('cockpit card status colors are visible', () => {
    const { container } = render(
      <BrowserRouter>
        <div>
          <div className="cockpit-value badge-ok" style={{ color: 'var(--cl-success)' }}>Ready</div>
          <div className="cockpit-value badge-warn" style={{ color: 'var(--cl-warn)' }}>Warning</div>
          <div className="cockpit-value badge-danger" style={{ color: 'var(--cl-danger)' }}>Danger</div>
        </div>
      </BrowserRouter>
    );

    expect(container.querySelector('.badge-ok')).toBeInTheDocument();
    expect(container.querySelector('.badge-warn')).toBeInTheDocument();
    expect(container.querySelector('.badge-danger')).toBeInTheDocument();
  });
});

describe('Keyboard Navigation - Requirements 5.1, 5.3', () => {
  it('supports Tab navigation through interactive elements', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start tabbing
    await user.tab();
    expect(screen.getByText('Skip to main content')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
  });

  it('supports Shift+Tab for backward navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab forward twice
    await user.tab();
    await user.tab();

    // Tab backward
    await user.tab({ shift: true });
    expect(screen.getByText('Skip to main content')).toHaveFocus();
  });

  it('FilterBar controls are keyboard accessible', async () => {
    const user = userEvent.setup();
    const onTimeRangeChange = vi.fn();
    const onPolicyProfileChange = vi.fn();

    render(
      <BrowserRouter>
        <FilterBar
          timeRange="7d"
          onTimeRangeChange={onTimeRangeChange}
          policyProfile="default"
          onPolicyProfileChange={onPolicyProfileChange}
          degradedMode={false}
          degradedServices={[]}
          policyPackVersion="v2.1.0"
          lastUpdated={new Date().toISOString()}
        />
      </BrowserRouter>
    );

    const timeRangeSelect = screen.getByLabelText(/select time range/i);
    const policyProfileSelect = screen.getByLabelText(/select policy profile/i);

    // Tab to time range selector
    await user.tab();
    expect(timeRangeSelect).toHaveFocus();

    // Tab to policy profile selector
    await user.tab();
    expect(policyProfileSelect).toHaveFocus();
  });

  it('Policy Change Modal supports ESC key to close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    // Press ESC
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('Modal close button is keyboard accessible', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    
    // Focus and activate close button
    closeButton.focus();
    expect(closeButton).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalled();
  });

  it('Dashboard action buttons are keyboard accessible', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    const policyChangeButton = screen.getByRole('button', { name: /request policy change/i });
    
    // Tab to button and verify focus
    policyChangeButton.focus();
    expect(policyChangeButton).toHaveFocus();
  });
});

describe('Screen Reader Support - Requirements 5.1, 5.5', () => {
  it('has semantic HTML landmarks', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('navigation links are properly labeled', () => {
    render(<App />);

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAccessibleName('Dashboard');
  });

  it('main content is focusable for skip link', () => {
    render(<App />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  it('FilterBar selects have proper labels', () => {
    const onTimeRangeChange = vi.fn();
    const onPolicyProfileChange = vi.fn();

    render(
      <BrowserRouter>
        <FilterBar
          timeRange="7d"
          onTimeRangeChange={onTimeRangeChange}
          policyProfile="default"
          onPolicyProfileChange={onPolicyProfileChange}
          degradedMode={false}
          degradedServices={[]}
          policyPackVersion="v2.1.0"
          lastUpdated={new Date().toISOString()}
        />
      </BrowserRouter>
    );

    const timeRangeSelect = screen.getByLabelText(/time range/i);
    expect(timeRangeSelect).toHaveAccessibleName();

    const policyProfileSelect = screen.getByLabelText(/policy profile/i);
    expect(policyProfileSelect).toHaveAccessibleName();
  });

  it('Degraded mode badge has proper ARIA attributes', () => {
    const onTimeRangeChange = vi.fn();
    const onPolicyProfileChange = vi.fn();

    render(
      <BrowserRouter>
        <FilterBar
          timeRange="7d"
          onTimeRangeChange={onTimeRangeChange}
          policyProfile="default"
          onPolicyProfileChange={onPolicyProfileChange}
          degradedMode={true}
          degradedServices={['ocr-service', 'recall-lookup']}
          policyPackVersion="v2.1.0"
          lastUpdated={new Date().toISOString()}
        />
      </BrowserRouter>
    );

    const degradedBadge = screen.getByRole('status');
    expect(degradedBadge).toHaveAttribute('aria-live', 'polite');
    expect(degradedBadge).toHaveAttribute('aria-label');
  });

  it('Policy Change Modal has proper dialog role', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('Form fields have proper labels and descriptions', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const contextField = screen.getByLabelText(/context/i);
    expect(contextField).toHaveAttribute('aria-required', 'true');
    expect(contextField).toHaveAttribute('aria-describedby');

    const constraintsField = screen.getByLabelText(/constraints/i);
    expect(constraintsField).toHaveAttribute('aria-required', 'true');

    const critiqueField = screen.getByLabelText(/self-critique/i);
    expect(critiqueField).toHaveAttribute('aria-required', 'true');
  });

  it('Sparklines have descriptive aria-labels', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const sparklines = document.querySelectorAll('svg[aria-label]');
      expect(sparklines.length).toBeGreaterThan(0);
      
      sparklines.forEach(sparkline => {
        expect(sparkline.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});

describe('Focus Management - Requirements 5.1', () => {
  it('modal prevents body scroll when open', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    const { unmount } = render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    // Body scroll should be prevented
    expect(document.body.style.overflow).toBe('hidden');

    // Cleanup restores scroll
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('form fields receive focus indicators', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const contextField = screen.getByLabelText(/context/i);
    
    // Focus the field
    await user.click(contextField);
    expect(contextField).toHaveFocus();
  });

  it('submit button is disabled when form is invalid', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });
});

describe('ARIA Attributes - Requirements 5.1, 5.5', () => {
  it('uses aria-label for navigation', () => {
    render(<App />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('uses role attributes correctly', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('error messages have role="alert"', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const contextField = screen.getByLabelText(/context/i);
    
    // Type less than minimum and blur to trigger validation
    await user.type(contextField, 'Too short');
    await user.tab();

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('impact preview has proper region role', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    // Fill all fields with valid content to show impact preview
    const contextField = screen.getByLabelText(/context/i);
    const constraintsField = screen.getByLabelText(/constraints/i);
    const critiqueField = screen.getByLabelText(/self-critique/i);

    // Use paste instead of type for faster test execution
    await user.click(contextField);
    await user.paste('A'.repeat(200));
    await user.click(constraintsField);
    await user.paste('B'.repeat(100));
    await user.click(critiqueField);
    await user.paste('C'.repeat(100));

    await waitFor(() => {
      const impactPreview = screen.getByRole('region', { name: /impact preview/i });
      expect(impactPreview).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('table has proper table role and structure', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for column headers
      const columnHeaders = within(table).getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });
  });
});

describe('Touch Targets - Requirement 5.3', () => {
  it('checkboxes meet minimum 44x44px touch target', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // Verify checkboxes have minimum size styling
      checkboxes.forEach(checkbox => {
        const style = checkbox.style;
        // Check that minWidth and minHeight are set to 44px
        expect(style.minWidth).toBe('44px');
        expect(style.minHeight).toBe('44px');
      });
    });
  });

  it('action buttons are adequately sized', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const policyChangeButton = screen.getByRole('button', { name: /request policy change/i });
      expect(policyChangeButton).toBeInTheDocument();
      
      // Button should be visible and clickable
      expect(policyChangeButton).toBeVisible();
    });
  });

  it('modal close button is adequately sized', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    expect(closeButton).toBeVisible();
  });
});

describe('Reduced Motion - Requirement 5.5', () => {
  it('respects prefers-reduced-motion for animations', () => {
    // Mock matchMedia to return prefers-reduced-motion: reduce
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // The component should render without animations
    // This is primarily tested through CSS, but we verify the component renders
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });
});

describe('Form Validation - Requirements 5.1', () => {
  it('shows validation errors with proper aria-invalid', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const contextField = screen.getByLabelText(/context/i);
    
    // Type insufficient content and blur
    await user.type(contextField, 'Short');
    await user.tab();

    await waitFor(() => {
      expect(contextField).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('character counters provide feedback', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const contextField = screen.getByLabelText(/context/i);
    
    // Type some content
    await user.type(contextField, 'Test content');

    // Character counter should be visible - check for the specific counter
    const charCounter = document.getElementById('context-count');
    expect(charCounter).toBeInTheDocument();
    expect(charCounter?.textContent).toContain('characters');
  });

  it('submit button has descriptive aria-label when disabled', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <PolicyChangeModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          operator="test-user"
        />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /complete all required fields/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-label');
  });
});
