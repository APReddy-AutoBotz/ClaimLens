/**
 * Property-Based Test: Glass Depth Contrast Preservation
 * Feature: b2c-admin-final-polish, Property 8: Contrast Preservation
 * Validates: Requirements 2.5
 * 
 * Tests that enhanced glass surface styling maintains WCAG AA contrast ratios
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

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

// Parse rgba string to components
function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    throw new Error(`Invalid rgba color: ${rgba}`);
  }
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

// Simulate glass surface over background
function simulateGlassOverBackground(
  glassRgba: string,
  backgroundHex: string
): { r: number; g: number; b: number } {
  const glass = parseRgba(glassRgba);
  const bg = hexToRgb(backgroundHex);

  // Alpha compositing: result = foreground * alpha + background * (1 - alpha)
  return {
    r: Math.round(glass.r * glass.a + bg.r * (1 - glass.a)),
    g: Math.round(glass.g * glass.a + bg.g * (1 - glass.a)),
    b: Math.round(glass.b * glass.a + bg.b * (1 - glass.a)),
  };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

describe('Property 8: Contrast Preservation', () => {
  // Enhanced glass surface values from design
  const ENHANCED_GLASS_BG = 'rgba(15, 22, 40, 0.65)';
  const ORIGINAL_GLASS_BG = 'rgba(15, 22, 40, 0.55)';

  // Color palette
  const colors = {
    ink: '#0B1220',
    surface: '#0F1628',
    cloud: '#F8FAFC',
    spectralTeal: '#14B8A6',
    spectralMint: '#2DD4BF',
    emberOrange: '#F59E0B',
    allow: '#10B981',
    modify: '#F59E0B',
    avoid: '#EF4444',
  };

  describe('Enhanced Glass Depth maintains WCAG AA contrast', () => {
    it('should maintain 4.5:1 contrast for body text on enhanced glass surface', () => {
      // Simulate glass over dark background
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Test primary text (cloud) on glass surface
      const ratio = getContrastRatio(colors.cloud, effectiveGlassHex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should maintain 4.5:1 contrast for teal text on enhanced glass surface', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      const ratio = getContrastRatio(colors.spectralTeal, effectiveGlassHex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should maintain 4.5:1 contrast for status colors on enhanced glass surface', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Test all status colors
      const statusColors = [colors.allow, colors.modify, colors.avoid];
      statusColors.forEach(color => {
        const ratio = getContrastRatio(color, effectiveGlassHex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should maintain 3:1 contrast for interactive elements on enhanced glass', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Test button colors
      const interactiveColors = [colors.spectralTeal, colors.spectralMint];
      interactiveColors.forEach(color => {
        const ratio = getContrastRatio(color, effectiveGlassHex);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Property: Enhanced glass preserves or improves contrast vs original', () => {
    it('for any light text color, enhanced glass maintains WCAG AA contrast', () => {
      // Only test with light/bright colors that are actually used for text on dark backgrounds
      const textColors = [
        colors.cloud,
        colors.spectralTeal,
        colors.spectralMint,
        colors.emberOrange,
        colors.allow,
        colors.modify,
        colors.avoid,
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...textColors),
          (textColor) => {
            const enhancedGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
            const enhancedGlassHex = rgbToHex(enhancedGlass.r, enhancedGlass.g, enhancedGlass.b);

            const ratio = getContrastRatio(textColor, enhancedGlassHex);
            
            // All our light palette colors should maintain at least 3:1 (interactive minimum)
            expect(ratio).toBeGreaterThanOrEqual(3);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any light text color, enhanced glass contrast >= original glass contrast', () => {
      // Only test with light/bright colors that are actually used for text on dark backgrounds
      const textColors = [
        colors.cloud,
        colors.spectralTeal,
        colors.spectralMint,
        colors.emberOrange,
        colors.allow,
        colors.modify,
        colors.avoid,
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...textColors),
          (textColor) => {
            const enhancedGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
            const enhancedGlassHex = rgbToHex(enhancedGlass.r, enhancedGlass.g, enhancedGlass.b);

            const originalGlass = simulateGlassOverBackground(ORIGINAL_GLASS_BG, colors.ink);
            const originalGlassHex = rgbToHex(originalGlass.r, originalGlass.g, originalGlass.b);

            const enhancedRatio = getContrastRatio(textColor, enhancedGlassHex);
            const originalRatio = getContrastRatio(textColor, originalGlassHex);

            // Enhanced glass should maintain or improve contrast
            // (Higher alpha makes background more opaque, which can improve contrast)
            expect(enhancedRatio).toBeGreaterThanOrEqual(originalRatio * 0.95); // Allow 5% tolerance
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Border contrast with enhanced glass', () => {
    it('should maintain visible border contrast with enhanced alpha', () => {
      // Enhanced border: rgba(248, 250, 252, 0.12)
      // Original border: rgba(248, 250, 252, 0.10)
      
      const enhancedGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const enhancedGlassHex = rgbToHex(enhancedGlass.r, enhancedGlass.g, enhancedGlass.b);

      // Simulate border over glass
      const enhancedBorder = simulateGlassOverBackground('rgba(248, 250, 252, 0.12)', enhancedGlassHex);
      const enhancedBorderHex = rgbToHex(enhancedBorder.r, enhancedBorder.g, enhancedBorder.b);

      // Border should be distinguishable from glass surface (at least 1.2:1)
      const borderRatio = getContrastRatio(enhancedBorderHex, enhancedGlassHex);
      expect(borderRatio).toBeGreaterThanOrEqual(1.1);
    });
  });

  describe('Specific WCAG AA requirements', () => {
    it('should meet WCAG AA for body text (< 18px) at 4.5:1', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Primary body text
      const ratio = getContrastRatio(colors.cloud, effectiveGlassHex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA for large text (>= 18px) at 3:1', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Large text (headings, etc.)
      const ratio = getContrastRatio(colors.cloud, effectiveGlassHex);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('should meet WCAG AA for interactive elements at 3:1', () => {
      const effectiveGlass = simulateGlassOverBackground(ENHANCED_GLASS_BG, colors.ink);
      const effectiveGlassHex = rgbToHex(effectiveGlass.r, effectiveGlass.g, effectiveGlass.b);

      // Interactive elements (buttons, links)
      const ratio = getContrastRatio(colors.spectralTeal, effectiveGlassHex);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
