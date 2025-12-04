/**
 * Tests for VerdictBadge Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerdictBadge } from '../VerdictBadge';
import type { Verdict } from '../../lib/trust-score';

describe('VerdictBadge', () => {
  it('should render allow verdict with correct styling', () => {
    const verdict: Verdict = {
      label: 'allow',
      color: '#10B981',
      icon: '✓',
      explanation: 'This product meets safety standards with minimal concerns.',
    };
    
    render(<VerdictBadge verdict={verdict} />);
    
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Verdict: allow');
    expect(screen.getByText('Allow')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render caution verdict with correct styling', () => {
    const verdict: Verdict = {
      label: 'caution',
      color: '#F59E0B',
      icon: '⚠',
      explanation: 'This product has some concerns. Review the details before deciding.',
    };
    
    render(<VerdictBadge verdict={verdict} />);
    
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Verdict: caution');
    expect(screen.getByText('Caution')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should render avoid verdict with correct styling', () => {
    const verdict: Verdict = {
      label: 'avoid',
      color: '#EF4444',
      icon: '✕',
      explanation: 'This product has significant safety or accuracy concerns.',
    };
    
    render(<VerdictBadge verdict={verdict} />);
    
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Verdict: avoid');
    expect(screen.getByText('Avoid')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should capitalize verdict label', () => {
    const verdict: Verdict = {
      label: 'allow',
      color: '#10B981',
      icon: '✓',
      explanation: 'Safe',
    };
    
    render(<VerdictBadge verdict={verdict} />);
    
    expect(screen.getByText('Allow')).toBeInTheDocument();
    expect(screen.queryByText('allow')).not.toBeInTheDocument();
  });

  it('should have icon marked as aria-hidden', () => {
    const verdict: Verdict = {
      label: 'allow',
      color: '#10B981',
      icon: '✓',
      explanation: 'Safe',
    };
    
    const { container } = render(<VerdictBadge verdict={verdict} />);
    
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon?.textContent).toBe('✓');
  });
});
