/**
 * Consumer API Routes
 * POST /v1/consumer/scan - B2C consumer scanning endpoint
 */

import { Router, Request, Response } from 'express';
import { calculateTrustScore, getVerdict, TrustScoreInput } from '../../../packages/core/trust-score';
import { Errors } from '../middleware/error-handler';
import { logger } from '../../../packages/core/logger';
import { metrics } from '../../../packages/core/metrics';

export interface ConsumerScanRequest {
  input_type: 'url' | 'screenshot' | 'text' | 'barcode';
  input_data: string;
  locale?: string;
  allergen_profile?: string[];
}

export interface ConsumerScanResponse {
  product_info?: {
    product_name: string;
    brand?: string;
    category?: string;
    claims?: string[];
    scanned_text_preview?: string;
  };
  trust_score: number;
  verdict: {
    label: 'allow' | 'caution' | 'avoid';
    color: string;
    icon: string;
    explanation: string;
  };
  badges: Array<{
    kind: 'warn' | 'danger' | 'ok';
    label: string;
    explanation: string;
    source?: string;
  }>;
  reasons: Array<{
    transform: string;
    why: string;
    source?: string;
  }>;
  suggestions?: Array<{
    name: string;
    trust_score: number;
    key_differences: string[];
  }>;
  correlation_id: string;
}

const router = Router();

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract text from URL (mock implementation)
 */
async function extractTextFromUrl(url: string): Promise<string> {
  // TODO: Implement actual URL fetching and text extraction
  // For now, return mock data
  return 'Mock text extracted from URL';
}

/**
 * Extract product information from text
 */
function extractProductInfo(text: string, inputType: string): {
  product_name: string;
  brand?: string;
  category?: string;
  claims?: string[];
  scanned_text_preview?: string;
} {
  // TODO: Implement actual product info extraction using NLP/AI
  // For now, use simple heuristics and mock data
  
  const lines = text.split('\n').filter(line => line.trim());
  const preview = text.substring(0, 200);
  
  // Try to extract product name (usually first line or longest line)
  let productName = 'Unknown Product';
  if (lines.length > 0) {
    productName = lines[0].trim() || 'Scanned Product';
  }
  
  // Try to extract brand (look for common patterns)
  let brand: string | undefined;
  const brandPatterns = [/by\s+([A-Z][a-zA-Z\s&]+)/i, /brand:\s*([A-Z][a-zA-Z\s&]+)/i];
  for (const pattern of brandPatterns) {
    const match = text.match(pattern);
    if (match) {
      brand = match[1].trim();
      break;
    }
  }
  
  // Try to extract category (look for common food categories)
  let category: string | undefined;
  const categoryKeywords = [
    'bread', 'juice', 'cereal', 'snack', 'beverage', 'dairy', 
    'protein', 'supplement', 'organic', 'granola', 'yogurt'
  ];
  const lowerText = text.toLowerCase();
  for (const keyword of categoryKeywords) {
    if (lowerText.includes(keyword)) {
      category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }
  
  // Try to extract claims (look for common marketing claims)
  const claims: string[] = [];
  const claimPatterns = [
    /\b(organic|natural|gluten[- ]free|non[- ]gmo|vegan|sugar[- ]free|low[- ]fat|high[- ]protein)\b/gi
  ];
  for (const pattern of claimPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const claim = match[1].toLowerCase().replace(/[- ]/g, ' ');
      const formattedClaim = claim.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!claims.includes(formattedClaim)) {
        claims.push(formattedClaim);
      }
    }
  }
  
  return {
    product_name: productName,
    brand,
    category,
    claims: claims.length > 0 ? claims : undefined,
    scanned_text_preview: preview,
  };
}

/**
 * POST /v1/consumer/ocr
 * Extract text from image using OCR
 */
router.post('/ocr', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const route = '/v1/consumer/ocr';
  const correlationId = (req as any).correlationId || 'unknown';
  
  metrics.active_requests.inc({ tenant: 'consumer', route });
  
  try {
    const { image_data } = req.body;
    
    if (!image_data) {
      throw Errors.badRequest('Missing required field: image_data');
    }
    
    // Validate base64 image data
    if (!image_data.startsWith('data:image/')) {
      throw Errors.badRequest('Invalid image data format');
    }
    
    // TODO: Call MCP ocr.label service
    // For now, return mock OCR result
    const mockText = 'Organic Whole Wheat Bread\nIngredients: Whole wheat flour, water, yeast, salt, honey\nMay contain traces of nuts';
    
    const result = {
      text: mockText,
      confidence: 0.95,
    };
    
    const duration = Date.now() - startTime;
    metrics.requests_total.inc({ tenant: 'consumer', route, status: '200' });
    metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
    
    logger.info({
      request_id: correlationId,
      tenant: 'consumer',
      route,
      decision: 'allow',
      duration_ms: duration,
      metadata: {
        text_length: result.text.length,
        confidence: result.confidence,
      },
    });
    
    res.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const status = (error as any).statusCode || 500;
    metrics.requests_total.inc({ tenant: 'consumer', route, status: status.toString() });
    metrics.requests_failed.inc({ 
      tenant: 'consumer', 
      route, 
      error_code: (error as any).code || 'UNKNOWN' 
    });
    metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
    
    logger.error({
      request_id: correlationId,
      tenant: 'consumer',
      route,
      duration_ms: duration,
      error: {
        code: (error as any).code || 'UNKNOWN',
        message: (error as any).message || 'Unknown error',
      },
    });
    
    throw error;
  } finally {
    metrics.active_requests.dec({ tenant: 'consumer', route });
  }
});

/**
 * POST /v1/consumer/scan
 * Consumer scanning endpoint with trust score calculation
 */
router.post('/scan', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const route = '/v1/consumer/scan';
  const correlationId = (req as any).correlationId || 'unknown';
  
  // Track active requests
  metrics.active_requests.inc({ tenant: 'consumer', route });
  
  try {
    const body = req.body as ConsumerScanRequest;

    // Validate required fields
    if (!body.input_type) {
      throw Errors.badRequest('Missing required field: input_type');
    }

    if (!body.input_data) {
      throw Errors.badRequest('Missing required field: input_data');
    }

    // Validate input_type
    const validInputTypes = ['url', 'screenshot', 'text', 'barcode'];
    if (!validInputTypes.includes(body.input_type)) {
      throw Errors.badRequest(
        `Invalid input_type. Must be one of: ${validInputTypes.join(', ')}`
      );
    }

    // Validate input size for text
    if (body.input_type === 'text') {
      const textSize = Buffer.byteLength(body.input_data, 'utf8');
      if (textSize > 10 * 1024) {
        throw Errors.badRequest('Text input exceeds maximum size of 10KB');
      }
    }

    // Validate URL format
    if (body.input_type === 'url' && !isValidUrl(body.input_data)) {
      throw Errors.badRequest('Invalid URL format');
    }

    // Extract text based on input type
    let textToAnalyze = '';
    
    switch (body.input_type) {
      case 'text':
        textToAnalyze = body.input_data;
        break;
      
      case 'url':
        textToAnalyze = await extractTextFromUrl(body.input_data);
        break;
      
      case 'screenshot':
        // For screenshot, input_data should already be extracted text
        // (OCR is done client-side or via separate /ocr endpoint)
        textToAnalyze = body.input_data;
        break;
      
      case 'barcode':
        // For barcode, input_data should be formatted product text
        textToAnalyze = body.input_data;
        break;
    }

    // TODO: Apply transform pipeline with "claimlens_consumer" profile
    // For now, use mock data for trust score calculation
    
    // Mock detection results
    const bannedClaimsCount = 0;
    const hasRecall = false;
    const userAllergensCount = body.allergen_profile?.length || 0;
    const weaselWordDensity = 0.0;

    // Calculate trust score
    const trustScoreInput: TrustScoreInput = {
      bannedClaimsCount,
      hasRecall,
      userAllergensCount,
      weaselWordDensity,
    };

    const trustScoreResult = calculateTrustScore(trustScoreInput);
    const verdict = getVerdict(trustScoreResult.score);

    // Extract product info from text
    const productInfo = extractProductInfo(textToAnalyze, body.input_type);

    // Build response
    const response: ConsumerScanResponse = {
      product_info: productInfo,
      trust_score: trustScoreResult.score,
      verdict: {
        label: verdict.label,
        color: verdict.color,
        icon: verdict.icon,
        explanation: verdict.explanation,
      },
      badges: [],
      reasons: [],
      correlation_id: correlationId,
    };

    // Add allergen warnings if configured
    if (body.allergen_profile && body.allergen_profile.length > 0) {
      response.badges.push({
        kind: 'warn',
        label: 'Allergen Profile Active',
        explanation: `Checking for ${body.allergen_profile.length} configured allergen(s)`,
      });
    }

    // Record success metrics
    const duration = Date.now() - startTime;
    metrics.requests_total.inc({ tenant: 'consumer', route, status: '200' });
    metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
    
    // Log success
    logger.info({
      request_id: correlationId,
      tenant: 'consumer',
      route,
      decision: 'allow',
      duration_ms: duration,
      metadata: {
        input_type: body.input_type,
        trust_score: trustScoreResult.score,
        verdict: verdict.label,
      },
    });

    res.json(response);
  } catch (error) {
    // Record failure metrics
    const duration = Date.now() - startTime;
    const status = (error as any).statusCode || 500;
    metrics.requests_total.inc({ tenant: 'consumer', route, status: status.toString() });
    metrics.requests_failed.inc({ 
      tenant: 'consumer', 
      route, 
      error_code: (error as any).code || 'UNKNOWN' 
    });
    metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
    
    // Log error
    logger.error({
      request_id: correlationId,
      tenant: 'consumer',
      route,
      duration_ms: duration,
      error: {
        code: (error as any).code || 'UNKNOWN',
        message: (error as any).message || 'Unknown error',
      },
    });
    
    throw error;
  } finally {
    // Decrement active requests
    metrics.active_requests.dec({ tenant: 'consumer', route });
  }
});

export default router;
