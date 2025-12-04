/**
 * Generate meaningful display names for scanned products
 */

export interface DisplayNameOptions {
  method: 'url' | 'screenshot' | 'barcode' | 'text';
  urlInput?: string;
  textInput?: string;
  barcodeCode?: string;
  extractedText?: string;
  apiProductName?: string;
  pageTitle?: string;
}

/**
 * Extract a meaningful product name from URL
 */
function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Skip generic terms and find product-like path segments
    const genericTerms = ['product', 'products', 'item', 'items', 'p', 'i', 'menu', 'food', 'shop'];
    const productSegment = pathParts.find(part => 
      part.length > 3 && 
      !genericTerms.includes(part.toLowerCase())
    );
    
    if (productSegment) {
      // Convert kebab-case or snake_case to Title Case
      return productSegment
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return `Product from ${hostname}`;
  } catch {
    return 'Web Product';
  }
}

/**
 * Extract a meaningful name from text content
 */
function extractNameFromText(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 0) return 'Text Scan';
  
  // First line is usually the product name
  const firstLine = lines[0];
  
  // If it's too long, truncate
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }
  
  return firstLine;
}

/**
 * Generate a display name for a scanned product
 */
export function generateDisplayName(options: DisplayNameOptions): string {
  const { method, urlInput, textInput, barcodeCode, extractedText, apiProductName, pageTitle } = options;
  
  // Priority 1: API product name (most reliable)
  if (apiProductName && apiProductName.trim()) {
    return apiProductName.trim();
  }
  
  // Priority 2: Page title (for URLs)
  if (pageTitle && pageTitle.trim() && method === 'url') {
    return pageTitle.trim();
  }
  
  // Priority 3: Method-specific extraction
  switch (method) {
    case 'url':
      if (urlInput) {
        return extractNameFromUrl(urlInput);
      }
      return 'Web Product';
      
    case 'text':
      if (textInput) {
        return extractNameFromText(textInput);
      }
      return 'Text Scan';
      
    case 'screenshot':
      if (extractedText) {
        return extractNameFromText(extractedText);
      }
      return 'Screenshot Scan';
      
    case 'barcode':
      if (barcodeCode) {
        return `Barcode ${barcodeCode}`;
      }
      return 'Barcode Scan';
      
    default:
      return 'Unknown Item';
  }
}
