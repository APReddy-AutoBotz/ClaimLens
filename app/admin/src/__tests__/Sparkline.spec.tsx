import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Sparkline from '../components/Sparkline';

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders with correct viewBox dimensions', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} width={120} height={40} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 40');
  });

  it('renders with custom dimensions', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} width={200} height={60} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 60');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('includes gradient fill', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    // SVG elements need to be queried differently in jsdom
    const defs = container.querySelector('defs');
    expect(defs).toBeTruthy();
    
    const stops = container.querySelectorAll('stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
  });

  it('renders stroke path', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2); // Fill path and stroke path
  });

  it('renders dots when showDots is true', () => {
    const data = [10, 20, 15, 25, 30, 28, 35];
    const { container } = render(
      <Sparkline data={data} showDots={true} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(data.length);
  });

  it('does not render dots by default', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(0);
  });

  it('has accessibility label with trend description', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label');
    expect(svg?.getAttribute('aria-label')).toContain('trend');
  });

  it('uses custom aria label when provided', () => {
    const customLabel = 'Custom trend visualization';
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} ariaLabel={customLabel} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', customLabel);
  });

  it('has role="img" for accessibility', () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
  });

  it('handles empty data gracefully', () => {
    const { container } = render(
      <Sparkline data={[]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute('aria-label', 'No data');
  });

  it('handles single data point', () => {
    const { container } = render(
      <Sparkline data={[42]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('detects increasing trend', () => {
    const { container } = render(
      <Sparkline data={[10, 15, 20, 25, 30, 35, 40]} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('increasing');
  });

  it('detects decreasing trend', () => {
    const { container } = render(
      <Sparkline data={[40, 35, 30, 25, 20, 15, 10]} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('decreasing');
  });

  it('detects stable trend', () => {
    const { container } = render(
      <Sparkline data={[20, 21, 20, 19, 20, 21, 20]} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('stable');
  });

  it('applies custom color', () => {
    const customColor = '#FF5733';
    const { container } = render(
      <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} color={customColor} />
    );

    const strokePath = container.querySelectorAll('path')[1]; // Second path is the stroke
    expect(strokePath).toHaveAttribute('stroke', customColor);
  });

  // Data normalization tests (Requirement 2.6, 2.7)
  describe('Data normalization', () => {
    it('normalizes data with large range', () => {
      const { container } = render(
        <Sparkline data={[0, 1000, 500, 2000, 1500, 1800, 2500]} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      
      // Verify paths are generated (normalization succeeded)
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('normalizes data with small range', () => {
      const { container } = render(
        <Sparkline data={[0.001, 0.002, 0.0015, 0.0025, 0.003, 0.0028, 0.0035]} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('normalizes data with negative values', () => {
      const { container } = render(
        <Sparkline data={[-10, -5, -8, -2, 0, 3, 5]} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('normalizes data with all same values', () => {
      const { container } = render(
        <Sparkline data={[42, 42, 42, 42, 42, 42, 42]} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-label')).toContain('stable');
    });

    it('handles exactly 7 data points as specified', () => {
      const data = [10, 20, 15, 25, 30, 28, 35];
      const { container } = render(
        <Sparkline data={data} showDots={true} />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(7);
    });
  });

  // SVG path generation tests (Requirement 2.6, 2.7)
  describe('SVG path generation', () => {
    it('generates valid SVG path with M command', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const strokePath = container.querySelectorAll('path')[1];
      const pathData = strokePath.getAttribute('d');
      
      expect(pathData).toBeTruthy();
      expect(pathData).toMatch(/^M /); // Path starts with Move command
    });

    it('generates smooth curve using quadratic bezier (Q command)', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const strokePath = container.querySelectorAll('path')[1];
      const pathData = strokePath.getAttribute('d');
      
      expect(pathData).toContain('Q'); // Contains quadratic bezier commands
    });

    it('generates fill path with closed shape (Z command)', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const fillPath = container.querySelectorAll('path')[0];
      const pathData = fillPath.getAttribute('d');
      
      expect(pathData).toContain('Z'); // Path is closed
      expect(pathData).toContain('L'); // Contains line commands to close shape
    });

    it('uses lightweight SVG without external dependencies', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const svg = container.querySelector('svg');
      
      // Verify it's a pure SVG element (no canvas, no external chart library classes)
      expect(svg?.tagName).toBe('svg');
      expect(svg?.querySelector('canvas')).toBeNull();
    });

    it('applies stroke styling correctly', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const strokePath = container.querySelectorAll('path')[1];
      
      expect(strokePath).toHaveAttribute('stroke-width', '2');
      expect(strokePath).toHaveAttribute('fill', 'none');
      expect(strokePath).toHaveAttribute('stroke-linecap', 'round');
      expect(strokePath).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('creates gradient with correct opacity stops', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const stops = container.querySelectorAll('stop');
      
      expect(stops.length).toBe(2);
      expect(stops[0]).toHaveAttribute('stop-opacity', '0.3');
      expect(stops[1]).toHaveAttribute('stop-opacity', '0');
    });
  });

  // Accessibility label tests (Requirement 2.6, 2.7)
  describe('Accessibility labels', () => {
    it('provides descriptive trend label for screen readers', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const svg = container.querySelector('svg');
      const label = svg?.getAttribute('aria-label');
      
      expect(label).toMatch(/7-day trend: (increasing|decreasing|stable)/);
    });

    it('calculates increasing trend correctly (>10% increase)', () => {
      const { container } = render(
        <Sparkline data={[10, 12, 14, 16, 18, 20, 25]} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toContain('increasing');
    });

    it('calculates decreasing trend correctly (>10% decrease)', () => {
      const { container } = render(
        <Sparkline data={[100, 95, 90, 85, 80, 75, 70]} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toContain('decreasing');
    });

    it('calculates stable trend for small changes (<10%)', () => {
      const { container } = render(
        <Sparkline data={[100, 102, 101, 103, 102, 104, 105]} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toContain('stable');
    });

    it('allows custom aria-label override', () => {
      const customLabel = 'Weekly sales trend showing growth';
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} ariaLabel={customLabel} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe(customLabel);
    });

    it('includes role="img" for assistive technology', () => {
      const { container } = render(
        <Sparkline data={[10, 20, 15, 25, 30, 28, 35]} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
    });
  });
});
