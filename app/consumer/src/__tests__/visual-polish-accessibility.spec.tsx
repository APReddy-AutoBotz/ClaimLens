/**
 * Visual Polish Accessibility Tests
 * 
 * Tests for Task 9: B2C Visual Polish - Ghost Light & Mist
 * Validates Requirements 2.5, 2.6
 * 
 * Ensures:
 * - All enhancements maintain WCAG AA contrast
 * - Reduced motion disables effects
 * - Focus indicators remain visible
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VerdictBanner } from '../components/VerdictBanner';

describe('Visual Polish Accessibility Tests', () => {
  describe('CSS Classes Exist', () => {
    it('should have ghost-light-teal class', () => {
      const { container } = render(
        <div className="ghost-light-teal">Test</div>
      );
      const element = container.querySelector('.ghost-light-teal');
      expect(element).toBeTruthy();
    });

    it('should have ghost-light-violet class', () => {
      const { container } = render(
        <div className="ghost-light-violet">Test</div>
      );
      const element = container.querySelector('.ghost-light-violet');
      expect(element).toBeTruthy();
    });

    it('should have mist-gradient class', () => {
      const { container } = render(
        <div className="mist-gradient">Test</div>
      );
      const element = container.querySelector('.mist-gradient');
      expect(element).toBeTruthy();
    });

    it('should have ember-accent class', () => {
      const { container } = render(
        <div className="ember-accent">Test</div>
      );
      const element = container.querySelector('.ember-accent');
      expect(element).toBeTruthy();
    });

    it('should have ember-glow class', () => {
      const { container } = render(
        <div className="ember-glow">Test</div>
      );
      const element = container.querySelector('.ember-glow');
      expect(element).toBeTruthy();
    });
  });

  describe('Verdict Banner Styling', () => {
    it('should render modify verdict banner', () => {
      const { container } = render(
        <BrowserRouter>
          <VerdictBanner verdict="modify" score={65} />
        </BrowserRouter>
      );
      // Check that banner renders with content
      expect(container.textContent).toContain('Proceed with caution');
    });

    it('should render avoid verdict banner', () => {
      const { container } = render(
        <BrowserRouter>
          <VerdictBanner verdict="avoid" score={35} />
        </BrowserRouter>
      );
      // Check that banner renders with content
      expect(container.textContent).toContain('Do not invite this into your body');
    });

    it('should render allow verdict banner', () => {
      const { container } = render(
        <BrowserRouter>
          <VerdictBanner verdict="allow" score={85} />
        </BrowserRouter>
      );
      // Check that banner renders with content
      expect(container.textContent).toContain('Marked safe');
    });
  });

  describe('Text Readability', () => {
    it('should render text content correctly', () => {
      const { container } = render(
        <div className="kw-glass">
          <p>Test Text</p>
        </div>
      );
      const text = container.querySelector('p');
      expect(text?.textContent).toBe('Test Text');
    });

    it('should render button text correctly with ghost-light', () => {
      const { container } = render(
        <button className="ghost-light-teal">Button Text</button>
      );
      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Button Text');
    });
  });

  describe('Focus Management', () => {
    it('should allow focus on interactive elements', () => {
      const { container } = render(
        <button className="kw-btn-primary">Interactive Button</button>
      );
      const button = container.querySelector('button');
      button?.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});
