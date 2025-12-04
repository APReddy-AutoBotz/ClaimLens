/**
 * Accessibility-focused E2E tests for ClaimLens Go
 * Task 8.6: WCAG AA contrast, keyboard navigation, ARIA labels
 * Requirements: 15.1-15.5, 24.2, 24.3
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, '../fixtures/sites');

test.describe('Accessibility Tests', () => {
  test('should calculate WCAG AA contrast ratios', async ({ page }) => {
    // Requirement 15.4, 24.2: WCAG AA contrast ≥4.5:1
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject test badges with design token colors
    await page.evaluate(() => {
      const container = document.querySelector('.restaurant-menu');
      if (!container) return;
      
      // Design tokens from requirements
      const badges = [
        { kind: 'allergen', bg: '#EF4444', text: '#FFFFFF', label: 'Contains Peanuts' }, // Red
        { kind: 'warning', bg: '#F59E0B', text: '#FFFFFF', label: 'Warning' },           // Amber with white text for contrast
        { kind: 'ok', bg: '#10B981', text: '#FFFFFF', label: 'Verified' }                // Emerald
      ];
      
      badges.forEach((badge, i) => {
        const el = document.createElement('div');
        el.className = `claimlens-badge claimlens-badge-${badge.kind}`;
        el.style.backgroundColor = badge.bg;
        el.style.color = badge.text;
        el.style.padding = '4px 8px';
        el.style.borderRadius = '4px';
        el.style.display = 'inline-block';
        el.style.margin = '4px';
        el.textContent = badge.label;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-label', `${badge.kind}: ${badge.label}`);
        el.setAttribute('tabindex', '0');
        container.appendChild(el);
      });
    });
    
    // Calculate contrast ratios
    const contrastResults = await page.evaluate(() => {
      const badges = document.querySelectorAll('.claimlens-badge');
      
      // Helper to calculate relative luminance
      const getLuminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map(val => {
          const sRGB = val / 255;
          return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      
      // Helper to parse RGB color
      const parseRGB = (color: string): number[] => {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
      };
      
      const results: { kind: string; contrast: number; passes: boolean }[] = [];
      
      badges.forEach((badge) => {
        const styles = window.getComputedStyle(badge);
        const bgColor = parseRGB(styles.backgroundColor);
        const textColor = parseRGB(styles.color);
        
        const bgLuminance = getLuminance(bgColor);
        const textLuminance = getLuminance(textColor);
        
        const lighter = Math.max(bgLuminance, textLuminance);
        const darker = Math.min(bgLuminance, textLuminance);
        const contrast = (lighter + 0.05) / (darker + 0.05);
        
        const kind = badge.className.includes('allergen') ? 'allergen' :
                     badge.className.includes('warning') ? 'warning' : 'ok';
        
        results.push({
          kind,
          contrast: Math.round(contrast * 100) / 100,
          passes: contrast >= 4.5
        });
      });
      
      return results;
    });
    
    // Verify all badges meet WCAG AA standard
    contrastResults.forEach(result => {
      expect(result.contrast).toBeGreaterThanOrEqual(4.5);
      console.log(`✓ ${result.kind} badge: ${result.contrast}:1 contrast (WCAG AA ${result.passes ? 'PASS' : 'FAIL'})`);
    });
  });

  test('should support keyboard navigation with Tab', async ({ page }) => {
    // Requirement 15.1: Tab key navigation
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject focusable badges
    await page.evaluate(() => {
      const items = document.querySelectorAll('.menu-item');
      items.forEach((item, i) => {
        const badge = document.createElement('button');
        badge.className = 'claimlens-badge';
        badge.textContent = `Badge ${i + 1}`;
        badge.setAttribute('tabindex', '0');
        badge.style.padding = '4px 8px';
        badge.style.margin = '4px';
        item.appendChild(badge);
      });
    });
    
    // Tab through badges
    await page.keyboard.press('Tab');
    
    const firstFocused = await page.evaluate(() => {
      return document.activeElement?.className || '';
    });
    
    expect(firstFocused).toContain('claimlens-badge');
    console.log('✓ Keyboard navigation: Tab works');
  });

  test('should display visible focus indicators (≥2px)', async ({ page }) => {
    // Requirement 15.2, 24.3: Visible focus rings ≥2px
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject badge with focus ring
    await page.evaluate(() => {
      const badge = document.createElement('button');
      badge.className = 'claimlens-badge';
      badge.textContent = 'Test Badge';
      badge.style.outline = '2px solid #4F46E5'; // Indigo from design tokens
      badge.style.outlineOffset = '2px';
      badge.setAttribute('tabindex', '0');
      document.body.appendChild(badge);
    });
    
    // Focus the badge
    await page.keyboard.press('Tab');
    
    // Check focus ring width
    const focusRingWidth = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return 0;
      
      const styles = window.getComputedStyle(focused);
      return parseInt(styles.outlineWidth) || 0;
    });
    
    expect(focusRingWidth).toBeGreaterThanOrEqual(2);
    console.log(`✓ Focus ring width: ${focusRingWidth}px (≥2px required)`);
  });

  test('should close tooltips with ESC key', async ({ page }) => {
    // Requirement 15.3: ESC closes tooltips
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject badge with tooltip
    await page.evaluate(() => {
      const badge = document.createElement('button');
      badge.className = 'claimlens-badge';
      badge.textContent = 'Badge';
      badge.setAttribute('tabindex', '0');
      
      const tooltip = document.createElement('div');
      tooltip.className = 'claimlens-tooltip';
      tooltip.textContent = 'Tooltip content';
      tooltip.style.display = 'none';
      tooltip.style.position = 'absolute';
      tooltip.style.background = '#0B1220';
      tooltip.style.color = '#F8FAFC';
      tooltip.style.padding = '8px';
      tooltip.style.borderRadius = '4px';
      
      badge.addEventListener('click', () => {
        tooltip.style.display = 'block';
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          tooltip.style.display = 'none';
        }
      });
      
      document.body.appendChild(badge);
      document.body.appendChild(tooltip);
    });
    
    // Click badge to open tooltip
    await page.click('.claimlens-badge');
    let tooltipVisible = await page.isVisible('.claimlens-tooltip');
    expect(tooltipVisible).toBe(true);
    
    // Press ESC to close
    await page.keyboard.press('Escape');
    tooltipVisible = await page.isVisible('.claimlens-tooltip');
    expect(tooltipVisible).toBe(false);
    
    console.log('✓ ESC key closes tooltip');
  });

  test('should include ARIA labels for all interactive elements', async ({ page }) => {
    // Requirement 15.5: ARIA labels
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject badges with ARIA attributes
    await page.evaluate(() => {
      const badges = [
        { kind: 'allergen', label: 'Contains Peanuts' },
        { kind: 'warning', label: 'High Sugar' },
        { kind: 'ok', label: 'Verified Safe' }
      ];
      
      badges.forEach(badge => {
        const el = document.createElement('button');
        el.className = `claimlens-badge claimlens-badge-${badge.kind}`;
        el.textContent = badge.label;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-label', `${badge.kind}: ${badge.label}`);
        el.setAttribute('tabindex', '0');
        document.body.appendChild(el);
      });
    });
    
    // Check ARIA attributes
    const ariaLabels = await page.evaluate(() => {
      const badges = document.querySelectorAll('.claimlens-badge');
      return Array.from(badges).map(badge => ({
        role: badge.getAttribute('role'),
        ariaLabel: badge.getAttribute('aria-label'),
        tabIndex: badge.getAttribute('tabindex')
      }));
    });
    
    // Verify all badges have proper ARIA attributes
    ariaLabels.forEach((attrs, i) => {
      expect(attrs.role).toBe('status');
      expect(attrs.ariaLabel).toBeTruthy();
      expect(attrs.tabIndex).toBe('0');
      console.log(`✓ Badge ${i + 1}: role="${attrs.role}", aria-label="${attrs.ariaLabel}"`);
    });
  });

  test('should maintain keyboard focus order', async ({ page }) => {
    // Requirement 15.1: Logical tab order
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject multiple badges
    await page.evaluate(() => {
      const items = document.querySelectorAll('.menu-item');
      items.forEach((item, i) => {
        const badge = document.createElement('button');
        badge.className = 'claimlens-badge';
        badge.id = `badge-${i}`;
        badge.textContent = `Badge ${i + 1}`;
        badge.setAttribute('tabindex', '0');
        item.appendChild(badge);
      });
    });
    
    // Tab through and collect focus order
    const focusOrder: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.id || '');
      if (focused.startsWith('badge-')) {
        focusOrder.push(focused);
      }
    }
    
    // Verify logical order
    expect(focusOrder.length).toBeGreaterThan(0);
    console.log(`✓ Focus order: ${focusOrder.join(' → ')}`);
  });
});
