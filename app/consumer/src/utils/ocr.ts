/**
 * OCR Utility for Screenshot Text Extraction
 * Uses MCP ocr.label service for text extraction from images
 */

export interface OCRResult {
  text: string;
  confidence?: number;
  regions?: Array<{
    text: string;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Resize image to max dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  imageData: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageData;
  });
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(imageData: string): Promise<OCRResult> {
  try {
    // Resize image first
    const resizedImage = await resizeImage(imageData);
    
    // Call OCR API endpoint
    const response = await fetch('/v1/consumer/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_data: resizedImage,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'OCR processing failed');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP image.',
    };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`,
    };
  }
  
  return { valid: true };
}
