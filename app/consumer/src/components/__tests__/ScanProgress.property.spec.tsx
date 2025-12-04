/**
 * Property-Based Test: Reduced Motion Respect
 * 
 * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
 * **Validates: Requirements 10.2**
 * 
 * Property: For any animation, when prefers-reduced-motion is set, 
 * the animation duration SHALL be effectively zero (0.01ms or less).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import ScanProgress, { ScanStage } from '../ScanProgress';

/**
 * All possible scan stages that can trigger animations
 */
const SCAN_STAGES: ScanStage[] = ['idle', 'extract', 'checks', 'verdict', 'complete', 'error'];

/**
 * Maximum animation duration allowed when prefers-reduced-motion is set (in ms)
 */
const MAX_REDUCED_MOTION_DURATION_MS = 0.01;

/**
 * Helper to set prefers-reduced-motion media query
 */
function setReducedMotionPreference(enabled: boolean) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  Object.defineProperty(mediaQuery, 'matches', {
    writable: true,
    value: enabled,
  });
}

/**
 * Helper to get computed animation duration from an element
 */
function getAnimationDuration(element: Element): number {
  const styles = window.getComputedStyle(element);
  const duration = styles.animationDuration;
  
  if (!duration || duration === '0s') return 0;
  
  // Parse duration (can be in seconds or milliseconds)
  const match = duration.match(/^([\d.]+)(m?s)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return unit === 'ms' ? value : value * 1000;
}

/**
 * Helper to get computed transition duration from an element
 */
function getTransitionDuration(element: Element): number {
  const styles = window.getComputedStyle(element);
  const duration = styles.transitionDuration;
  
  if (!duration || duration === '0s') return 0;
  
  // Parse duration (can be in seconds or milliseconds)
  const match = duration.match(/^([\d.]+)(m?s)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return unit === 'ms' ? value : value * 1000;
}

describe('Property 7: Reduced Motion Respect', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    
    // Mock matchMedia
    window.matchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('spectral glow animation respects prefers-reduced-motion for all active stages', () => {
    const activeStages: ScanStage[] = ['extract', 'checks', 'verdict'];
    const stageArb = fc.constantFrom(...activeStages);

    fc.assert(
      fc.property(stageArb, (stage) => {
        // Enable reduced motion
        setReducedMotionPreference(true);

        const { container } = render(<ScanProgress stage={stage} />);
        const glowElement = container.querySelector('[class*="spectralGlow"]');

        if (!glowElement) {
          // If no glow element, that's acceptable (animation removed)
          return true;
        }

        const animationDuration = getAnimationDuration(glowElement);
        
        // Animation should be effectively disabled (0.01ms or less)
        return animationDuration <= MAX_REDUCED_MOTION_DURATION_MS;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('progress bar animation respects prefers-reduced-motion for all active stages', () => {
    const activeStages: ScanStage[] = ['extract', 'checks', 'verdict'];
    const stageArb = fc.constantFrom(...activeStages);

    fc.assert(
      fc.property(stageArb, (stage) => {
        // Enable reduced motion
        setReducedMotionPreference(true);

        const { container } = render(<ScanProgress stage={stage} />);
        const progressFill = container.querySelector('[class*="progressFill"]');

        if (!progressFill) {
          // If no progress fill, that's acceptable
          return true;
        }

        const animationDuration = getAnimationDuration(progressFill);
        
        // Animation should be effectively disabled (0.01ms or less)
        return animationDuration <= MAX_REDUCED_MOTION_DURATION_MS;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('container transitions respect prefers-reduced-motion for all stages', () => {
    const stageArb = fc.constantFrom(...SCAN_STAGES);

    fc.assert(
      fc.property(stageArb, (stage) => {
        // Enable reduced motion
        setReducedMotionPreference(true);

        const { container } = render(<ScanProgress stage={stage} />);
        const containerElement = container.querySelector('[class*="container"]');

        if (!containerElement) {
          return false; // Container should always exist
        }

        const transitionDuration = getTransitionDuration(containerElement);
        
        // Transition should be effectively disabled (0.01ms or less)
        return transitionDuration <= MAX_REDUCED_MOTION_DURATION_MS;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('component renders correctly for all stages regardless of motion preference', () => {
    const stageArb = fc.constantFrom(...SCAN_STAGES);
    const reducedMotionArb = fc.boolean();

    fc.assert(
      fc.property(stageArb, reducedMotionArb, (stage, reducedMotion) => {
        setReducedMotionPreference(reducedMotion);

        const { container } = render(<ScanProgress stage={stage} />);
        const containerElement = container.querySelector('[class*="container"]');

        // Component should always render
        return containerElement !== null;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('error messages display correctly with reduced motion enabled', () => {
    const errorMessages = [
      'Network error',
      'Invalid input',
      'Timeout',
      'Server error',
      'Unknown error',
    ];
    const errorArb = fc.constantFrom(...errorMessages);

    fc.assert(
      fc.property(errorArb, (errorMessage) => {
        setReducedMotionPreference(true);

        const { container } = render(
          <ScanProgress stage="error" error={errorMessage} />
        );

        // Error message should be visible in the container
        const errorElement = container.querySelector('[class*="errorMessage"]');
        return errorElement !== null && errorElement.textContent === errorMessage;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: consumer-kiroween-polish, Property 7: Reduced Motion Respect**
   * **Validates: Requirements 10.2**
   */
  it('stage labels are always visible regardless of motion preference', () => {
    const stageArb = fc.constantFrom(...SCAN_STAGES);
    const reducedMotionArb = fc.boolean();

    fc.assert(
      fc.property(stageArb, reducedMotionArb, (stage, reducedMotion) => {
        setReducedMotionPreference(reducedMotion);

        const { container } = render(<ScanProgress stage={stage} />);
        const labelElement = container.querySelector('[class*="label"]');

        // Label should always be present
        return labelElement !== null && labelElement.textContent !== '';
      }),
      { numRuns: 100 }
    );
  });
});
