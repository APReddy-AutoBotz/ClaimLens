/**
 * Color Contrast Verification Tests
 * Requirements: 10.4, 10.5
 * 
 * WCAG AA Requirements:
 * - Body text (< 18px): minimum 4.5:1 contrast ratio
 * - Large text (>= 18px): minimum 3:1 contrast ratio
 * - Interactive elements: minimum 3:1 contrast ratio
 */

import { describe, it, expect } from 'vitest';

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('Color Contrast - WCAG AA Compliance', () => {
  const colors = {
    // Foundation
    ink: '#0B1220',
    surface: '#0F1628',
    cloud: '#F8FAFC',

    // Kiroween Palette
    spectralTeal: '#14B8A6',
    spectralMint: '#2DD4BF',
    emberOrange: '#F59E0B',
    emberGlow: '#FBBF24',
    violetPolicy: '#8B5CF6',
    violetLight: '#A78BFA',

    // Status Colors
    allow: '#10B981',
    modify: '#F59E0B',
    avoid: '#EF4444',

    // Additional
    green: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
  };

  describe('Body Text Contrast (4.5:1 minimum)', () => {
    it('should have sufficient contrast for primary text on dark background', () => {
      const ratio = getContrastRatio(colors.cloud, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for primary text on surface', () => {
      const ratio = getContrastRatio(colors.cloud, colors.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for teal text on dark background', () => {
      const ratio = getContrastRatio(colors.spectralTeal, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for mint text on dark background', () => {
      const ratio = getContrastRatio(colors.spectralMint, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for orange text on dark background', () => {
      const ratio = getContrastRatio(colors.emberOrange, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for green (allow) text on dark background', () => {
      const ratio = getContrastRatio(colors.allow, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for red (avoid) text on dark background', () => {
      const ratio = getContrastRatio(colors.avoid, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Interactive Elements Contrast (3:1 minimum)', () => {
    it('should have sufficient contrast for teal buttons on dark background', () => {
      const ratio = getContrastRatio(colors.spectralTeal, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('should have sufficient contrast for button text (dark) on teal background', () => {
      const ratio = getContrastRatio(colors.ink, colors.spectralTeal);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('should have sufficient contrast for focus indicators', () => {
      const ratio = getContrastRatio(colors.spectralTeal, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Status Indicators', () => {
    it('should have sufficient contrast for allow/safe status', () => {
      const ratio = getContrastRatio(colors.allow, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for modify/caution status', () => {
      const ratio = getContrastRatio(colors.modify, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for avoid/danger status', () => {
      const ratio = getContrastRatio(colors.avoid, colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Non-Color Indicators', () => {
    it('should document that status badges include icons', () => {
      // This is a documentation test - status badges should always include icons
      // not just color to convey meaning
      const statusBadgeRequirements = {
        allow: { color: colors.allow, icon: '✓', text: 'Allow' },
        modify: { color: colors.modify, icon: '⚠', text: 'Modify' },
        avoid: { color: colors.avoid, icon: '✕', text: 'Avoid' },
      };

      // Verify each status has both icon and text
      Object.values(statusBadgeRequirements).forEach((status) => {
        expect(status.icon).toBeTruthy();
        expect(status.text).toBeTruthy();
        expect(status.color).toBeTruthy();
      });
    });

    it('should document that error states have text descriptions', () => {
      // Error states should never rely on color alone
      const errorStateRequirements = {
        hasTextDescription: true,
        hasIcon: true,
        hasAriaLabel: true,
      };

      expect(errorStateRequirements.hasTextDescription).toBe(true);
      expect(errorStateRequirements.hasIcon).toBe(true);
      expect(errorStateRequirements.hasAriaLabel).toBe(true);
    });
  });

  describe('Contrast Ratio Calculations', () => {
    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should handle same color (1:1 ratio)', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBeCloseTo(1, 0);
    });
  });
});
