import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  shareContent, 
  generateShareUrl, 
  encodeResultData,
  downloadImage 
} from '../share';

describe('Share Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('encodeResultData', () => {
    it('should encode result data as base64', () => {
      const result = { trust_score: 85, verdict: { label: 'allow' } };
      const encoded = encodeResultData(result);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      
      // Should be base64 encoded
      expect(() => atob(encoded)).not.toThrow();
    });

    it('should handle complex objects', () => {
      const result = {
        trust_score: 42,
        verdict: { label: 'modify' },
        issues: [
          { kind: 'warn', label: 'Test Issue', explanation: 'Test explanation' }
        ],
        breakdown: { baseScore: 100, finalScore: 42 }
      };
      
      const encoded = encodeResultData(result);
      expect(encoded).toBeTruthy();
    });
  });

  describe('generateShareUrl', () => {
    it('should generate a valid share URL', () => {
      const encodedData = 'test-encoded-data';
      const url = generateShareUrl(encodedData);
      
      expect(url).toContain('/results?data=');
      expect(url).toContain(encodeURIComponent(encodedData));
    });

    it('should use current origin', () => {
      const encodedData = 'test-data';
      const url = generateShareUrl(encodedData);
      
      expect(url).toContain(window.location.origin);
    });
  });

  describe('shareContent', () => {
    it('should use Web Share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });

      const shareData = {
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      };

      const result = await shareContent(shareData);

      expect(mockShare).toHaveBeenCalledWith({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url
      });
      expect(result.success).toBe(true);
      expect(result.method).toBe('native');
    });

    it('should fall back to clipboard when Web Share API is not available', async () => {
      // Remove Web Share API
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true
      });

      const shareData = {
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      };

      const result = await shareContent(shareData);

      expect(mockWriteText).toHaveBeenCalledWith(shareData.url);
      expect(result.success).toBe(true);
      expect(result.method).toBe('clipboard');
    });

    it('should handle share cancellation', async () => {
      const abortError = new Error('Share cancelled');
      abortError.name = 'AbortError';
      
      const mockShare = vi.fn().mockRejectedValue(abortError);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });

      const shareData = {
        title: 'Test',
        text: 'Test',
        url: 'https://example.com'
      };

      const result = await shareContent(shareData);

      // When share is cancelled, it should return failed status
      expect(result.success).toBe(false);
      expect(result.method).toBe('failed');
      expect(result.error).toBe('Share cancelled');
    });
  });

  describe('downloadImage', () => {
    it('should create and trigger download link', () => {
      const mockClick = vi.fn();
      const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      // Mock createElement to return an element with click method
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      });

      const dataUrl = 'data:image/png;base64,test';
      const filename = 'test.png';

      downloadImage(dataUrl, filename);

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      // Cleanup
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });
});
