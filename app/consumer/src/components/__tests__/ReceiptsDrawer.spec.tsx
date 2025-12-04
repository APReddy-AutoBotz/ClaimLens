import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptsDrawer } from '../ReceiptsDrawer';

describe('ReceiptsDrawer', () => {
  it('should render trigger button', () => {
    render(<ReceiptsDrawer />);
    
    expect(screen.getByText('Receipts')).toBeInTheDocument();
    expect(screen.getByText('No tricks. Just proof.')).toBeInTheDocument();
  });

  it('should expand on click', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer correlationId="test-456" checksRun={25} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('Why this verdict?')).toBeInTheDocument();
    expect(screen.getByText('test-456')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should show empty state when no receipts', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer receipts={[]} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText(/No policy violations detected/i)).toBeInTheDocument();
  });

  it('should render receipts when provided', async () => {
    const user = userEvent.setup();
    const receipts = [{
      ruleId: 'rule-1',
      ruleName: 'Banned Claim',
      packName: 'claims-pack',
      packVersion: '1.0.0',
      transformStep: 'detect.banned_claims',
      timestamp: new Date().toISOString(),
    }];
    
    render(<ReceiptsDrawer receipts={receipts} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('Banned Claim')).toBeInTheDocument();
    expect(screen.getByText(/rule-1/)).toBeInTheDocument();
  });

  it('should collapse when clicking trigger again', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer correlationId="test-123" checksRun={12} />);
    
    // Expand
    await user.click(screen.getByText('Receipts'));
    expect(screen.getByText('Why this verdict?')).toBeInTheDocument();
    
    // Collapse
    await user.click(screen.getByText('Receipts'));
    expect(screen.queryByText('Why this verdict?')).not.toBeInTheDocument();
  });

  it('should close on ESC key', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer correlationId="test-123" checksRun={12} />);
    
    // Expand
    await user.click(screen.getByText('Receipts'));
    expect(screen.getByText('Why this verdict?')).toBeInTheDocument();
    
    // Press ESC
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Why this verdict?')).not.toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<ReceiptsDrawer />);
    
    const trigger = screen.getByText('Receipts').closest('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('should update ARIA expanded when opened', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer />);
    
    const trigger = screen.getByText('Receipts').closest('button');
    
    await user.click(trigger!);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('should display correlation ID when provided', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer correlationId="abc-123-def" checksRun={5} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText(/abc-123-def/)).toBeInTheDocument();
  });

  it('should display checks run count when provided', async () => {
    const user = userEvent.setup();
    render(<ReceiptsDrawer correlationId="test-123" checksRun={15} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('should render receipt details when available', async () => {
    const user = userEvent.setup();
    const receipts = [{
      ruleId: 'rule-banned-001',
      ruleName: 'Detox Claim Detected',
      packName: 'health-claims-pack',
      packVersion: '2.1.0',
      transformStep: 'detect.banned_health_claims',
      beforeSnippet: 'Detox your body naturally',
      afterSnippet: '[FLAGGED] Detox your body naturally',
      timestamp: '2024-01-15T10:30:00Z',
    }];
    
    render(<ReceiptsDrawer receipts={receipts} />);
    
    await user.click(screen.getByText('Receipts'));
    
    expect(screen.getByText('Detox Claim Detected')).toBeInTheDocument();
    expect(screen.getByText(/rule-banned-001/)).toBeInTheDocument();
    expect(screen.getByText(/health-claims-pack/)).toBeInTheDocument();
    expect(screen.getByText(/2.1.0/)).toBeInTheDocument();
  });
});
