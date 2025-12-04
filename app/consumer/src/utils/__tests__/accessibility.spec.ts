import { describe, it, expect } from 'vitest';
import { getContrastRatio, meetsWCAGAA } from '../accessibility';

describe('Accessibility Utils', () => {
  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between two colors', () => {
      // Black on white should have high contrast
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeGreaterThan(20);
    });

    it('should calculate contrast for design system colors', () => {
      // Teal (#14B8A6) on Ink (#0B1220)
      const ratio = getContrastRatio('#14B8A6', '#0B1220');
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should return true for sufficient contrast', () => {
      expect(meetsWCAGAA('#FFFFFF', '#000000')).toBe(true);
      expect(meetsWCAGAA('#14B8A6', '#0B1220')).toBe(true);
    });

    it('should return false for insufficient contrast', () => {
      expect(meetsWCAGAA('#CCCCCC', '#FFFFFF')).toBe(false);
    });
  });
});
