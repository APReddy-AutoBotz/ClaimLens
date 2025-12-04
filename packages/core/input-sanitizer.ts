/**
 * Input Sanitization Utilities
 * Unicode normalization, HTML sanitization, input validation
 * Requirements: 18.1, 18.2
 */

/**
 * Sanitize text input with Unicode NFC normalization
 * Removes control characters and enforces length limits
 */
export function sanitizeText(text: string, maxLength: number = 10000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Unicode NFC normalization
  let sanitized = text.normalize('NFC');

  // Remove control characters except newline, tab, and carriage return
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Enforce length limit (10KB max per field)
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize HTML content for CSP-safe overlays
 * Removes script tags, event handlers, and javascript: URLs
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove data: URLs (potential XSS vector)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, '');

  // Remove style attributes with expressions
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\([^"']*\)["']/gi, '');

  return sanitized;
}

/**
 * Validate input length for all fields
 * Returns error if any field exceeds 10KB
 */
export function validateInputLength(
  data: Record<string, any>,
  maxLength: number = 10000
): { valid: boolean; error?: string } {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > maxLength) {
      return {
        valid: false,
        error: `Field "${key}" exceeds maximum length of ${maxLength} characters`,
      };
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedCheck = validateInputLength(value, maxLength);
      if (!nestedCheck.valid) {
        return nestedCheck;
      }
    }

    // Check array elements
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && value[i].length > maxLength) {
          return {
            valid: false,
            error: `Array field "${key}[${i}]" exceeds maximum length of ${maxLength} characters`,
          };
        }
        if (typeof value[i] === 'object' && value[i] !== null) {
          const nestedCheck = validateInputLength(value[i], maxLength);
          if (!nestedCheck.valid) {
            return nestedCheck;
          }
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitize MenuItem input
 * Applies text sanitization to all string fields
 */
export function sanitizeMenuItem(item: any): any {
  return {
    ...item,
    id: sanitizeText(item.id, 256),
    name: sanitizeText(item.name),
    description: item.description ? sanitizeText(item.description) : undefined,
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients.map((ing: string) => sanitizeText(ing))
      : typeof item.ingredients === 'string'
      ? sanitizeText(item.ingredients)
      : undefined,
    nutrition: item.nutrition ? sanitizeNutrition(item.nutrition) : undefined,
    metadata: item.metadata,
  };
}

/**
 * Sanitize nutrition object
 */
function sanitizeNutrition(nutrition: any): any {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(nutrition)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value, 100);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
