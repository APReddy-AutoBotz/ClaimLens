import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../components/EmptyState';

describe('EmptyState Component', () => {
  it('renders with title only', () => {
    render(<EmptyState title="No data yet" />);
    
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <EmptyState 
        title="No data yet" 
        description="Run a demo audit to see the system in action"
      />
    );
    
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Run a demo audit to see the system in action')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const { container } = render(
      <EmptyState 
        icon="🎉" 
        title="Success" 
      />
    );
    
    expect(container.textContent).toContain('🎉');
  });

  it('renders with default icon when not provided', () => {
    const { container } = render(
      <EmptyState title="No data" />
    );
    
    expect(container.textContent).toContain('📭');
  });

  it('renders CTA button when provided', () => {
    const handleClick = vi.fn();
    
    render(
      <EmptyState 
        title="No data yet" 
        ctaLabel="Run Demo Audit"
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Run Demo Audit' });
    expect(button).toBeInTheDocument();
  });

  it('does not render CTA button when not provided', () => {
    render(<EmptyState title="No data yet" />);
    
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('calls onCtaClick when CTA button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <EmptyState 
        title="No data yet" 
        ctaLabel="Run Demo Audit"
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Run Demo Audit' });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has accessible button with aria-label', () => {
    const handleClick = vi.fn();
    
    render(
      <EmptyState 
        title="No data yet" 
        ctaLabel="Run Demo Audit"
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Run Demo Audit' });
    expect(button).toHaveAttribute('aria-label', 'Run Demo Audit');
  });

  it('renders all elements with proper styling classes', () => {
    const { container } = render(
      <EmptyState 
        icon="📋"
        title="No data yet" 
        description="Test description"
        ctaLabel="Action"
        onCtaClick={() => {}}
      />
    );
    
    expect(container.querySelector('.empty-state')).toBeInTheDocument();
    expect(container.querySelector('.empty-state-icon')).toBeInTheDocument();
    expect(container.querySelector('.empty-state-hint')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const { container } = render(
      <EmptyState title="No data yet" />
    );
    
    expect(container.querySelector('.empty-state-hint')).not.toBeInTheDocument();
  });

  it('renders with all props provided', () => {
    const handleClick = vi.fn();
    
    const { container } = render(
      <EmptyState 
        icon="🎯"
        title="Custom Title" 
        description="Custom Description"
        ctaLabel="Custom Action"
        onCtaClick={handleClick}
      />
    );
    
    expect(container.textContent).toContain('🎯');
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });
});
