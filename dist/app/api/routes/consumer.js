/**
 * Consumer API Routes
 * POST /v1/consumer/scan - B2C consumer scanning endpoint
 */
import { Router } from 'express';
import { calculateTrustScore, getVerdict } from '../../../packages/core/trust-score';
import { Errors } from '../middleware/error-handler';
import { logger } from '../../../packages/core/logger';
import { metrics } from '../../../packages/core/metrics';
const router = Router();
/**
 * Validate URL format
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Extract text from URL (mock implementation)
 */
async function extractTextFromUrl(url) {
    // TODO: Implement actual URL fetching and text extraction
    // For now, return mock data
    return 'Mock text extracted from URL';
}
/**
 * POST /v1/consumer/ocr
 * Extract text from image using OCR
 */
router.post('/ocr', async (req, res) => {
    const startTime = Date.now();
    const route = '/v1/consumer/ocr';
    const correlationId = req.correlationId || 'unknown';
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
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const status = error.statusCode || 500;
        metrics.requests_total.inc({ tenant: 'consumer', route, status: status.toString() });
        metrics.requests_failed.inc({
            tenant: 'consumer',
            route,
            error_code: error.code || 'UNKNOWN'
        });
        metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
        logger.error({
            request_id: correlationId,
            tenant: 'consumer',
            route,
            duration_ms: duration,
            error: {
                code: error.code || 'UNKNOWN',
                message: error.message || 'Unknown error',
            },
        });
        throw error;
    }
    finally {
        metrics.active_requests.dec({ tenant: 'consumer', route });
    }
});
/**
 * POST /v1/consumer/scan
 * Consumer scanning endpoint with trust score calculation
 */
router.post('/scan', async (req, res) => {
    const startTime = Date.now();
    const route = '/v1/consumer/scan';
    const correlationId = req.correlationId || 'unknown';
    // Track active requests
    metrics.active_requests.inc({ tenant: 'consumer', route });
    try {
        const body = req.body;
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
            throw Errors.badRequest(`Invalid input_type. Must be one of: ${validInputTypes.join(', ')}`);
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
        const trustScoreInput = {
            bannedClaimsCount,
            hasRecall,
            userAllergensCount,
            weaselWordDensity,
        };
        const trustScoreResult = calculateTrustScore(trustScoreInput);
        const verdict = getVerdict(trustScoreResult.score);
        // Build response
        const response = {
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
    }
    catch (error) {
        // Record failure metrics
        const duration = Date.now() - startTime;
        const status = error.statusCode || 500;
        metrics.requests_total.inc({ tenant: 'consumer', route, status: status.toString() });
        metrics.requests_failed.inc({
            tenant: 'consumer',
            route,
            error_code: error.code || 'UNKNOWN'
        });
        metrics.request_duration_ms.observe({ tenant: 'consumer', route }, duration);
        // Log error
        logger.error({
            request_id: correlationId,
            tenant: 'consumer',
            route,
            duration_ms: duration,
            error: {
                code: error.code || 'UNKNOWN',
                message: error.message || 'Unknown error',
            },
        });
        throw error;
    }
    finally {
        // Decrement active requests
        metrics.active_requests.dec({ tenant: 'consumer', route });
    }
});
export default router;
