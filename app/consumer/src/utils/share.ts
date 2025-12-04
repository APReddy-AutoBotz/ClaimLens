/**
 * Share utilities for ClaimLens
 * Implements Web Share API with clipboard fallback
 * Requirements: 8.3, 8.4
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
  imageDataUrl?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'failed';
  error?: string;
}

/**
 * Share content using Web Share API with clipboard fallback
 * @param data - Content to share
 * @returns Result indicating success and method used
 */
export async function shareContent(data: ShareData): Promise<ShareResult> {
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      // If we have an image, try to share it as a file
      if (data.imageDataUrl) {
        const blob = await dataUrlToBlob(data.imageDataUrl);
        const file = new File([blob], 'claimlens-proof.png', { type: 'image/png' });
        
        // Check if files can be shared
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: data.title,
            text: data.text,
            files: [file]
          });
          return { success: true, method: 'native' };
        }
      }
      
      // Fall back to sharing just the URL and text
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url
      });
      
      return { success: true, method: 'native' };
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'failed', error: 'Share cancelled' };
      }
      
      // Fall through to clipboard fallback
      console.warn('Web Share API failed, falling back to clipboard:', error);
    }
  }
  
  // Fallback: Copy to clipboard
  try {
    await copyToClipboard(data.url);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    return { 
      success: false, 
      method: 'failed', 
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard'
    };
  }
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 */
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Convert data URL to Blob
 * @param dataUrl - Data URL to convert
 * @returns Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Generate shareable URL for scan results
 * @param resultData - Encoded scan result data
 * @returns Full shareable URL
 */
export function generateShareUrl(resultData: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/results?data=${encodeURIComponent(resultData)}`;
}

/**
 * Encode scan results for sharing
 * @param result - Scan result object
 * @returns Base64 encoded string
 */
export function encodeResultData(result: unknown): string {
  const jsonString = JSON.stringify(result);
  return btoa(encodeURIComponent(jsonString));
}

/**
 * Download image to device
 * @param dataUrl - Image data URL
 * @param filename - Filename for download
 */
export function downloadImage(dataUrl: string, filename: string = 'claimlens-proof.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
