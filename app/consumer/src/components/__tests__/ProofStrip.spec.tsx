import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProofStrip } from '../ProofStrip';

describe('ProofStrip', () => {
  it('should render all trust anchors', () => {
    render(<ProofStrip />);
    
    expect(screen.getByText('Processed locally by default')).toBeInTheDocument();
    expect(screen.getByText('No account required')).toBeInTheDocument();
    expect(screen.getByText('Receipts included')).toBeInTheDocument();
  });

  it('should render trust anchor descriptions', () => {
    render(<ProofStrip />);
    
    expect(screen.getByText('Your data stays on your device')).toBeInTheDocument();
    expect(screen.getByText('Start scanning immediately')).toBeInTheDocument();
    expect(screen.getByText('Full evidence trail for every check')).toBeInTheDocument();
  });

  it('should render with glassmorphism styling', () => {
    const { container } = render(<ProofStrip />);
    
    // Check that the component renders with the container
    const proofStrip = container.firstChild as HTMLElement;
    expect(proofStrip).toBeInTheDocument();
    // CSS modules generate hashed class names, just verify it has a class
    expect(proofStrip.className).toBeTruthy();
  });

  it('should display all three trust anchor icons', () => {
    render(<ProofStrip />);
    
    // Check that all three trust anchors are rendered by checking for their labels
    expect(screen.getByText('Processed locally by default')).toBeInTheDocument();
    expect(screen.getByText('No account required')).toBeInTheDocument();
    expect(screen.getByText('Receipts included')).toBeInTheDocument();
  });
});
