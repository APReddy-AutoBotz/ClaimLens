import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSwitch } from '../ModeSwitch';

describe('ModeSwitch', () => {
  it('should render consumer and business tabs', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    expect(screen.getByText('Consumer')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should call onModeChange when switching modes', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    await user.click(screen.getByText('Business'));
    
    expect(onModeChange).toHaveBeenCalledWith('business');
  });

  it('should show active state for current mode', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    const consumerTab = screen.getByText('Consumer').closest('button');
    expect(consumerTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should show inactive state for non-current mode', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    const businessTab = screen.getByText('Business').closest('button');
    expect(businessTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should have proper ARIA role', () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<ModeSwitch mode="consumer" onModeChange={onModeChange} />);
    
    const businessTab = screen.getByText('Business');
    await user.tab(); // Focus first element
    await user.tab(); // Focus business tab
    await user.keyboard('{Enter}');
    
    expect(onModeChange).toHaveBeenCalledWith('business');
  });
});
