/**
 * Tests for ProductHeader Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductHeader } from '../ProductHeader';
import type { ProductIdentity } from '../../types';

describe('ProductHeader', () => {
  describe('rendering with full product identity', () => {
    it('should render product name, brand, and category', () => {
      const productIdentity: ProductIdentity = {
        name: 'Organic Almond Milk',
        brand: 'Silk',
        category: 'Dairy Alternative',
        sourceType: 'barcode',
        sourceLabel: 'UPC 123456',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('Organic Almond Milk')).toBeInTheDocument();
      expect(screen.getByText('Silk')).toBeInTheDocument();
      expect(screen.getByText('Dairy Alternative')).toBeInTheDocument();
    });

    it('should render source chip with correct icon and label', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'barcode',
        sourceLabel: 'UPC 123456',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('UPC 123456')).toBeInTheDocument();
    });

    it('should render all source type icons correctly', () => {
      const sourceTypes: Array<{ type: ProductIdentity['sourceType']; icon: string; defaultLabel: string }> = [
        { type: 'url', icon: '🌐', defaultLabel: 'Web URL' },
        { type: 'screenshot', icon: '📸', defaultLabel: 'Screenshot' },
        { type: 'barcode', icon: '📊', defaultLabel: 'Barcode Scan' },
        { type: 'text', icon: '📝', defaultLabel: 'Text Input' },
      ];

      sourceTypes.forEach(({ type, icon, defaultLabel }) => {
        const { unmount } = render(
          <ProductHeader
            productIdentity={{
              name: 'Test Product',
              sourceType: type,
            }}
          />
        );

        expect(screen.getByText(icon)).toBeInTheDocument();
        expect(screen.getByText(defaultLabel)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('rendering with minimal data', () => {
    it('should render without brand and category', () => {
      const productIdentity: ProductIdentity = {
        name: 'Simple Product',
        sourceType: 'text',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('Simple Product')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument(); // No separator
    });

    it('should render with only brand', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        brand: 'TestBrand',
        sourceType: 'url',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('TestBrand')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument(); // No separator without category
    });

    it('should render with only category', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        category: 'Snacks',
        sourceType: 'screenshot',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('Snacks')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument(); // No separator without brand
    });

    it('should use default source label when not provided', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'url',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('Web URL')).toBeInTheDocument();
    });
  });

  describe('"Unknown Item" fallback', () => {
    it('should display "Unknown Item" when name is empty', () => {
      const productIdentity: ProductIdentity = {
        name: '',
        sourceType: 'text',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.getByText('Unknown Item')).toBeInTheDocument();
    });

    it('should display "Unknown Item" when name is "Unknown Item"', () => {
      const productIdentity: ProductIdentity = {
        name: 'Unknown Item',
        sourceType: 'text',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      const unknownElement = screen.getByText('Unknown Item');
      expect(unknownElement).toBeInTheDocument();
      // Check that the element has a class containing 'unknown' (CSS modules generate hashed names)
      expect(unknownElement.className).toMatch(/unknown/);
    });

    it('should apply unknown styling class', () => {
      const productIdentity: ProductIdentity = {
        name: '',
        sourceType: 'text',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      const unknownElement = screen.getByText('Unknown Item');
      // Check that the element has a class containing 'unknown' (CSS modules generate hashed names)
      expect(unknownElement.className).toMatch(/unknown/);
    });
  });

  describe('Rename button functionality', () => {
    it('should render Rename button when onRename is provided', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'barcode',
      };
      const onRename = vi.fn();

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      expect(screen.getByRole('button', { name: /rename product/i })).toBeInTheDocument();
      expect(screen.getByText('✏️ Rename')).toBeInTheDocument();
    });

    it('should not render Rename button when onRename is not provided', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'barcode',
      };

      render(<ProductHeader productIdentity={productIdentity} />);

      expect(screen.queryByRole('button', { name: /rename product/i })).not.toBeInTheDocument();
    });

    it('should call onRename with new name when user confirms', async () => {
      const user = userEvent.setup();
      const productIdentity: ProductIdentity = {
        name: 'Old Name',
        sourceType: 'text',
      };
      const onRename = vi.fn();

      // Mock window.prompt
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Product Name');

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const renameButton = screen.getByRole('button', { name: /rename product/i });
      await user.click(renameButton);

      expect(promptSpy).toHaveBeenCalledWith('Enter product name:', 'Old Name');
      expect(onRename).toHaveBeenCalledWith('New Product Name');

      promptSpy.mockRestore();
    });

    it('should not call onRename when user cancels', async () => {
      const user = userEvent.setup();
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'text',
      };
      const onRename = vi.fn();

      // Mock window.prompt to return null (cancel)
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const renameButton = screen.getByRole('button', { name: /rename product/i });
      await user.click(renameButton);

      expect(onRename).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });

    it('should not call onRename when user enters empty string', async () => {
      const user = userEvent.setup();
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'text',
      };
      const onRename = vi.fn();

      // Mock window.prompt to return empty string
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('');

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const renameButton = screen.getByRole('button', { name: /rename product/i });
      await user.click(renameButton);

      expect(onRename).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });

    it('should not call onRename when user enters same name', async () => {
      const user = userEvent.setup();
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'text',
      };
      const onRename = vi.fn();

      // Mock window.prompt to return same name
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Test Product');

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const renameButton = screen.getByRole('button', { name: /rename product/i });
      await user.click(renameButton);

      expect(onRename).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });

    it('should trim whitespace from new name', async () => {
      const user = userEvent.setup();
      const productIdentity: ProductIdentity = {
        name: 'Old Name',
        sourceType: 'text',
      };
      const onRename = vi.fn();

      // Mock window.prompt with whitespace
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('  New Name  ');

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const renameButton = screen.getByRole('button', { name: /rename product/i });
      await user.click(renameButton);

      expect(onRename).toHaveBeenCalledWith('New Name');

      promptSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label on rename button', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'barcode',
      };
      const onRename = vi.fn();

      render(<ProductHeader productIdentity={productIdentity} onRename={onRename} />);

      const button = screen.getByRole('button', { name: /rename product/i });
      expect(button).toHaveAttribute('aria-label', 'Rename product');
      expect(button).toHaveAttribute('title', 'Rename product');
    });

    it('should mark source icon as aria-hidden', () => {
      const productIdentity: ProductIdentity = {
        name: 'Test Product',
        sourceType: 'barcode',
      };

      const { container } = render(<ProductHeader productIdentity={productIdentity} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('📊');
    });
  });
});
