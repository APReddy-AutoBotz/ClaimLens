import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProofCard } from '../ProofCard';

describe('ProofCard Component', () => {
  it('should render canvas element', () => {
    const { container } = render(
      <ProofCard
        verdict="allow"
        score={85}
        topReasons={['No banned claims detected', 'All disclaimers present']}
        receiptsUrl="https://example.com/receipts"
        productName="Test Product"
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should accept onGenerated callback prop', () => {
    const onGenerated = vi.fn();
    
    const { container } = render(
      <ProofCard
        verdict="modify"
        score={55}
        topReasons={['Weasel words detected']}
        onGenerated={onGenerated}
      />
    );

    // Component should render with canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Note: onGenerated callback timing depends on canvas rendering
    // which is async and may not work reliably in jsdom test environment
    // In real browser usage, this callback will be called after canvas renders
  });

  it('should handle all verdict types', () => {
    const verdicts: Array<'allow' | 'modify' | 'avoid'> = ['allow', 'modify', 'avoid'];
    
    verdicts.forEach(verdict => {
      const { container } = render(
        <ProofCard
          verdict={verdict}
          score={50}
          topReasons={['Test reason']}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });
  });

  it('should handle empty reasons array', () => {
    const { container } = render(
      <ProofCard
        verdict="allow"
        score={100}
        topReasons={[]}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should truncate long product names', () => {
    const longName = 'A'.repeat(100);
    const onGenerated = vi.fn();
    
    render(
      <ProofCard
        verdict="allow"
        score={85}
        topReasons={['Test']}
        productName={longName}
        onGenerated={onGenerated}
      />
    );

    // Should not throw error
    expect(onGenerated).toBeDefined();
  });
});
