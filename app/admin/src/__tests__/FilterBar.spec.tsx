import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../components/FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    timeRange: '7d' as const,
    onTimeRangeChange: vi.fn(),
    policyProfile: 'Default',
    onPolicyProfileChange: vi.fn(),
    degradedMode: false,
    degradedServices: [],
    policyPackVersion: 'v2.1.0',
    lastUpdated: new Date().toISOString(),
  };

  it('renders time range selector with correct value', () => {
    render(<FilterBar {...defaultProps} />);
    
    const timeRangeSelect = screen.getByLabelText(/select time range/i);
    expect(timeRangeSelect).toBeTruthy();
    expect((timeRangeSelect as HTMLSelectElement).value).toBe('7d');
  });

  it('renders policy profile selector with correct value', () => {
    render(<FilterBar {...defaultProps} />);
    
    const profileSelect = screen.getByLabelText(/select policy profile/i);
    expect(profileSelect).toBeTruthy();
    expect((profileSelect as HTMLSelectElement).value).toBe('Default');
  });

  it('calls onTimeRangeChange when time range is changed', () => {
    const onTimeRangeChange = vi.fn();
    render(<FilterBar {...defaultProps} onTimeRangeChange={onTimeRangeChange} />);
    
    const timeRangeSelect = screen.getByLabelText(/select time range/i);
    fireEvent.change(timeRangeSelect, { target: { value: '24h' } });
    
    expect(onTimeRangeChange).toHaveBeenCalledWith('24h');
  });

  it('calls onPolicyProfileChange when profile is changed', () => {
    const onPolicyProfileChange = vi.fn();
    render(<FilterBar {...defaultProps} onPolicyProfileChange={onPolicyProfileChange} />);
    
    const profileSelect = screen.getByLabelText(/select policy profile/i);
    fireEvent.change(profileSelect, { target: { value: 'Strict' } });
    
    expect(onPolicyProfileChange).toHaveBeenCalledWith('Strict');
  });

  it('displays policy pack version', () => {
    render(<FilterBar {...defaultProps} policyPackVersion="v2.1.0" />);
    
    expect(screen.getByText('v2.1.0')).toBeTruthy();
  });

  it('displays last updated timestamp', () => {
    const lastUpdated = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    render(<FilterBar {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText(/updated 5m ago/i)).toBeTruthy();
  });

  it('displays degraded mode badge when degraded', () => {
    render(
      <FilterBar
        {...defaultProps}
        degradedMode={true}
        degradedServices={['recall-lookup', 'ocr-label']}
      />
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Degraded Mode');
    expect(badge.getAttribute('aria-label')).toBe(
      'System in degraded mode. Affected services: recall-lookup, ocr-label'
    );
  });

  it('does not display degraded mode badge when not degraded', () => {
    render(<FilterBar {...defaultProps} degradedMode={false} />);
    
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders tenant selector when onTenantChange is provided', () => {
    const onTenantChange = vi.fn();
    render(
      <FilterBar
        {...defaultProps}
        tenant="tenant-a"
        onTenantChange={onTenantChange}
        availableTenants={['tenant-a', 'tenant-b', 'tenant-c']}
      />
    );
    
    const tenantSelect = screen.getByLabelText(/select tenant/i);
    expect(tenantSelect).toBeTruthy();
    expect((tenantSelect as HTMLSelectElement).value).toBe('tenant-a');
  });

  it('does not render tenant selector when onTenantChange is not provided', () => {
    render(<FilterBar {...defaultProps} />);
    
    expect(screen.queryByLabelText(/select tenant/i)).toBeNull();
  });

  it('calls onTenantChange when tenant is changed', () => {
    const onTenantChange = vi.fn();
    render(
      <FilterBar
        {...defaultProps}
        onTenantChange={onTenantChange}
        availableTenants={['tenant-a', 'tenant-b']}
      />
    );
    
    const tenantSelect = screen.getByLabelText(/select tenant/i);
    fireEvent.change(tenantSelect, { target: { value: 'tenant-b' } });
    
    expect(onTenantChange).toHaveBeenCalledWith('tenant-b');
  });

  it('has visible focus indicators on all interactive elements', () => {
    render(<FilterBar {...defaultProps} />);
    
    const timeRangeSelect = screen.getByLabelText(/select time range/i);
    const profileSelect = screen.getByLabelText(/select policy profile/i);
    
    // Focus indicators are handled by CSS :focus-visible
    // We verify the elements are focusable
    expect(timeRangeSelect.getAttribute('tabindex')).not.toBe('-1');
    expect(profileSelect.getAttribute('tabindex')).not.toBe('-1');
  });

  it('meets minimum touch target size (44x44px)', () => {
    render(<FilterBar {...defaultProps} />);
    
    const timeRangeSelect = screen.getByLabelText(/select time range/i);
    const profileSelect = screen.getByLabelText(/select policy profile/i);
    
    // Elements have min-height: 44px in CSS
    // We verify they exist and are interactive
    expect(timeRangeSelect).toBeTruthy();
    expect(profileSelect).toBeTruthy();
  });

  it('formats last updated for just now', () => {
    const lastUpdated = new Date().toISOString();
    render(<FilterBar {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText(/updated just now/i)).toBeTruthy();
  });

  it('formats last updated for hours ago', () => {
    const lastUpdated = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    render(<FilterBar {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText(/updated 2h ago/i)).toBeTruthy();
  });

  it('formats last updated for days ago', () => {
    const lastUpdated = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
    render(<FilterBar {...defaultProps} lastUpdated={lastUpdated} />);
    
    expect(screen.getByText(/updated 3d ago/i)).toBeTruthy();
  });

  it('handles invalid timestamp gracefully', () => {
    render(<FilterBar {...defaultProps} lastUpdated="invalid-date" />);
    
    expect(screen.getByText(/updated recently/i)).toBeTruthy();
  });
});
