/**
 * Menu API Routes
 * POST /v1/menu/feed - Full menu analysis
 * POST /v1/menu/validate - Quick single-item validation
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { MenuItem, Verdict } from '../../../packages/core/types';
import { normalizeIngredients } from '../../../packages/core/normalize';
import { TransformPipeline } from '../../../packages/core/pipeline';
import { PolicyLoader } from '../../../packages/core/policy-loader';
import { Errors } from '../middleware/error-handler';
import { IdempotencyManager } from '../middleware/idempotency';
import { resolve } from 'path';
import { redactPiiTransform } from '../../../packages/transforms/redact.pii';
import { detectAllergensTransform } from '../../../packages/transforms/detect.allergens';
import { rewriteDisclaimerTransform } from '../../../packages/transforms/rewrite.disclaimer';
import { logger } from '../../../packages/core/logger';
import { metrics } from '../../../packages/core/metrics';
import { sloTracker } from '../../../packages/core/slo-tracker';
import { webhookManager } from './webhooks';

export interface AuthenticatedRequest extends Request {
  tenant: string;
  apiKey: string;
  correlationId: string;
}

// Create idempotency manager instance
const idempotencyManager = new IdempotencyManager();

// Create policy loader instance
const policyLoader = new PolicyLoader({
  policyPath: resolve(process.cwd(), '.kiro/specs/policies.yaml'),
  rulePacksDir: resolve(process.cwd(), 'packs'),
});

// Create database pool (mock for now)
const pool = {
  query: async () => ({ rows: [] }),
} as any as Pool;

const router = Router();

/**
 * Trigger webhook delivery for verdict
 */
async function triggerWebhook(
  tenant: string,
  verdict: Verdict,
  itemId: string
): Promise<void> {
  try {
    // Get webhook configuration for tenant
    const result = await pool.query(
      `SELECT webhook_url, webhook_secret 
       FROM tenant_config 
       WHERE tenant = $1 AND webhook_url IS NOT NULL`,
      [tenant]
    );

    if (result.rows.length === 0) {
      // No webhook configured, skip
      return;
    }

    const config = {
      url: result.rows[0].webhook_url,
      secret: result.rows[0].webhook_secret,
    };

    // Create and deliver webhook payload
    const payload = webhookManager.createPayload(tenant, verdict, itemId);
    
    // Deliver asynchronously (don't block response)
    webhookManager.deliverWebhook(config, payload).catch(error => {
      logger.error({
        request_id: verdict.correlation_id,
        tenant,
        metadata: {
          error: 'Webhook delivery failed',
          message: error.message,
        },
      });
    });
  } catch (error) {
    // Log error but don't fail the request
    logger.error({
      request_id: verdict.correlation_id,
      tenant,
      metadata: {
        error: 'Failed to trigger webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * POST /v1/menu/feed
 * Full menu analysis with menushield_in profile
 */
router.post('/feed', (async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const route = '/v1/menu/feed';
  
  // Track active requests
  metrics.active_requests.inc({ tenant: req.tenant, route });
  
  try {
    // Get idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // Handle request with idempotency
    const result = await idempotencyManager.handleRequest(
      idempotencyKey,
      async () => {
        const { items } = req.body;

        // Validate input
        if (!items) {
          throw Errors.badRequest('Missing required field: items');
        }

        // Accept single item or array
        const itemsArray: MenuItem[] = Array.isArray(items) ? items : [items];

        if (itemsArray.length === 0) {
          throw Errors.badRequest('Items array cannot be empty');
        }

        // Validate each item has required fields
        for (const item of itemsArray) {
          if (!item.id || !item.name) {
            throw Errors.badRequest('Each item must have id and name fields');
          }
        }

        // Initialize transform pipeline
        const pipeline = new TransformPipeline();
        const policy = policyLoader.loadPolicy();
        pipeline.loadPolicy(policy);
        
        // Register transforms
        pipeline.registerTransform('redact.pii', redactPiiTransform);
        pipeline.registerTransform('detect.allergens', detectAllergensTransform);
        pipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);

        // Process each item
        const verdicts: Verdict[] = [];

        for (const item of itemsArray) {
          // Normalize ingredients before processing
          const normalizedItem = {
            ...item,
            ingredients: normalizeIngredients(item.ingredients),
          };

          // Execute transform pipeline
          const verdict = await pipeline.execute(
            normalizedItem,
            'menushield_in',
            {
              locale: req.body.locale || 'en-IN',
              tenant: req.tenant,
              correlationId: req.correlationId,
            }
          );

          verdicts.push(verdict);

          // Trigger webhook for this verdict (async, non-blocking)
          triggerWebhook(req.tenant, verdict, item.id);
        }

        // Return verdicts array with correlation_id
        return {
          verdicts,
          correlation_id: req.correlationId,
        };
      }
    );

    // Record success metrics
    const duration = Date.now() - startTime;
    metrics.requests_total.inc({ tenant: req.tenant, route, status: '200' });
    metrics.request_duration_ms.observe({ tenant: req.tenant, route }, duration);
    sloTracker.recordRequest(route, true);
    
    // Log success
    logger.info({
      request_id: req.correlationId,
      tenant: req.tenant,
      route,
      decision: 'allow',
      duration_ms: duration,
    });

    res.json(result);
  } catch (error) {
    // Record failure metrics
    const duration = Date.now() - startTime;
    const status = (error as any).statusCode || 500;
    metrics.requests_total.inc({ tenant: req.tenant, route, status: status.toString() });
    metrics.requests_failed.inc({ 
      tenant: req.tenant, 
      route, 
      error_code: (error as any).code || 'UNKNOWN' 
    });
    metrics.request_duration_ms.observe({ tenant: req.tenant, route }, duration);
    sloTracker.recordRequest(route, false);
    
    // Log error
    logger.error({
      request_id: req.correlationId,
      tenant: req.tenant,
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
    metrics.active_requests.dec({ tenant: req.tenant, route });
  }
}) as any);

/**
 * POST /v1/menu/validate
 * Quick single-item validation with subset of transforms
 * Target p95 latency ≤100ms
 */
router.post('/validate', (async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const route = '/v1/menu/validate';
  
  // Track active requests
  metrics.active_requests.inc({ tenant: req.tenant, route });
  
  try {
    // Get idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // Handle request with idempotency
    const result = await idempotencyManager.handleRequest(
      idempotencyKey,
      async () => {
        const { item } = req.body;

        // Validate input
        if (!item) {
          throw Errors.badRequest('Missing required field: item');
        }

        if (!item.id || !item.name) {
          throw Errors.badRequest('Item must have id and name fields');
        }

        // Normalize ingredients before processing
        const normalizedItem = {
          ...item,
          ingredients: normalizeIngredients(item.ingredients),
        };

        // Initialize transform pipeline with menushield_in profile
        // The /v1/menu/validate route uses a subset of transforms for faster processing
        const pipeline = new TransformPipeline();
        const policy = policyLoader.loadPolicy();
        pipeline.loadPolicy(policy);
        
        // Register transforms
        pipeline.registerTransform('redact.pii', redactPiiTransform);
        pipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);

        // Execute transform pipeline
        const verdict = await pipeline.execute(
          normalizedItem,
          'menushield_in',
          {
            locale: req.body.locale || 'en-IN',
            tenant: req.tenant,
            correlationId: req.correlationId,
          }
        );

        // Trigger webhook for this verdict (async, non-blocking)
        triggerWebhook(req.tenant, verdict, item.id);

        // Return single verdict with audit_id
        return {
          verdict,
          audit_id: verdict.audit_id,
          correlation_id: req.correlationId,
        };
      }
    );

    // Record success metrics
    const duration = Date.now() - startTime;
    metrics.requests_total.inc({ tenant: req.tenant, route, status: '200' });
    metrics.request_duration_ms.observe({ tenant: req.tenant, route }, duration);
    sloTracker.recordRequest(route, true);
    
    // Log success
    logger.info({
      request_id: req.correlationId,
      tenant: req.tenant,
      route,
      decision: 'allow',
      duration_ms: duration,
    });

    res.json(result);
  } catch (error) {
    // Record failure metrics
    const duration = Date.now() - startTime;
    const status = (error as any).statusCode || 500;
    metrics.requests_total.inc({ tenant: req.tenant, route, status: status.toString() });
    metrics.requests_failed.inc({ 
      tenant: req.tenant, 
      route, 
      error_code: (error as any).code || 'UNKNOWN' 
    });
    metrics.request_duration_ms.observe({ tenant: req.tenant, route }, duration);
    sloTracker.recordRequest(route, false);
    
    // Log error
    logger.error({
      request_id: req.correlationId,
      tenant: req.tenant,
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
    metrics.active_requests.dec({ tenant: req.tenant, route });
  }
}) as any);

export default router;
