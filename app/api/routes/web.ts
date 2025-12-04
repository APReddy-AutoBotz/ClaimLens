/**
 * Web API Routes
 * POST /v1/web/ingest - Process web items for ClaimLens Go extension
 */

import { Router, Request, Response } from 'express';
import { normalizeIngredients } from '../../../packages/core/normalize';
import { TransformPipeline } from '../../../packages/core/pipeline';
import { PolicyLoader } from '../../../packages/core/policy-loader';
import { Errors } from '../middleware/error-handler';
import { resolve } from 'path';
import { redactPiiTransform } from '../../../packages/transforms/redact.pii';
import { detectAllergensTransform } from '../../../packages/transforms/detect.allergens';
import { rewriteDisclaimerTransform } from '../../../packages/transforms/rewrite.disclaimer';

export interface AuthenticatedRequest extends Request {
  tenant: string;
  apiKey: string;
  correlationId: string;
}

/**
 * Web item from browser extension
 */
interface WebItem {
  id: string;
  name: string;
  description?: string;
  ingredients?: string[];
  nutrition?: Record<string, any>;
  dom_selector: string;
  metadata?: Record<string, any>;
}

/**
 * Badge to be displayed on content
 */
interface Badge {
  item_id: string;
  kind: 'allergen' | 'warning' | 'info' | 'ok';
  label: string;
  explanation: string;
  source?: string;
  dom_selector: string;
}

// Create policy loader instance
const policyLoader = new PolicyLoader({
  policyPath: resolve(process.cwd(), '.kiro/specs/policies.yaml'),
  rulePacksDir: resolve(process.cwd(), 'packs'),
});

const router = Router();

/**
 * POST /v1/web/ingest
 * Process web items and generate badges for ClaimLens Go extension
 * Target p95 latency ≤120ms
 */
router.post('/ingest', (async (req: AuthenticatedRequest, res: Response) => {
  const startTime = performance.now();
  
  try {
    const { items } = req.body;
    const locale = req.headers['x-locale'] as string || 'en-IN';

    // Validate input
    if (!items || !Array.isArray(items)) {
      throw Errors.badRequest('Missing or invalid field: items (must be array)');
    }

    if (items.length === 0) {
      throw Errors.badRequest('Items array cannot be empty');
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.id || !item.name || !item.dom_selector) {
        throw Errors.badRequest('Each item must have id, name, and dom_selector fields');
      }
    }

    // Initialize transform pipeline with claimlens_go profile
    const pipeline = new TransformPipeline();
    const policy = policyLoader.loadPolicy();
    pipeline.loadPolicy(policy);
    
    // Register transforms
    pipeline.registerTransform('redact.pii', redactPiiTransform);
    pipeline.registerTransform('detect.allergens', detectAllergensTransform);
    pipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimerTransform);

    // Process each item and generate badges
    const badges: Badge[] = [];

    for (const webItem of items as WebItem[]) {
      // Convert WebItem to MenuItem format
      const menuItem = {
        id: webItem.id,
        name: webItem.name,
        description: webItem.description,
        ingredients: normalizeIngredients(webItem.ingredients),
        nutrition: webItem.nutrition,
        metadata: webItem.metadata,
      };

      // Execute transform pipeline
      const verdict = await pipeline.execute(
        menuItem,
        'claimlens_go',
        {
          locale,
          tenant: req.tenant || 'default',
          correlationId: req.correlationId,
        }
      );

      // Convert verdict to badges
      const itemBadges = generateBadges(webItem, verdict);
      badges.push(...itemBadges);
    }

    const duration = performance.now() - startTime;
    console.log(`[Web/Ingest] Processed ${items.length} items in ${duration.toFixed(2)}ms`);

    // Return badges array with correlation_id
    res.json({
      badges,
      correlation_id: req.correlationId,
    });
  } catch (error) {
    throw error;
  }
}) as any);

/**
 * Generate badges from verdict
 */
function generateBadges(webItem: WebItem, verdict: any): Badge[] {
  const badges: Badge[] = [];

  // Check for allergens
  const allergenReasons = verdict.reasons.filter((r: any) => 
    r.transform === 'detect.allergens'
  );
  
  if (allergenReasons.length > 0) {
    for (const reason of allergenReasons) {
      badges.push({
        item_id: webItem.id,
        kind: 'allergen',
        label: extractAllergenName(reason.why),
        explanation: reason.why,
        source: reason.source,
        dom_selector: webItem.dom_selector,
      });
    }
  }

  // Check for banned claims (warnings)
  const disclaimerReasons = verdict.reasons.filter((r: any) => 
    r.transform === 'rewrite.disclaimer'
  );
  
  if (disclaimerReasons.length > 0) {
    for (const reason of disclaimerReasons) {
      badges.push({
        item_id: webItem.id,
        kind: 'warning',
        label: 'Claim Modified',
        explanation: reason.why,
        source: reason.source,
        dom_selector: webItem.dom_selector,
      });
    }
  }

  // Check for PII redaction (info)
  const piiReasons = verdict.reasons.filter((r: any) => 
    r.transform === 'redact.pii'
  );
  
  if (piiReasons.length > 0) {
    badges.push({
      item_id: webItem.id,
      kind: 'info',
      label: 'PII Redacted',
      explanation: 'Personal information has been redacted for privacy',
      source: undefined,
      dom_selector: webItem.dom_selector,
    });
  }

  // If no issues found, add OK badge
  if (badges.length === 0 && verdict.verdict === 'allow') {
    badges.push({
      item_id: webItem.id,
      kind: 'ok',
      label: 'Verified',
      explanation: 'No issues detected with this item',
      source: undefined,
      dom_selector: webItem.dom_selector,
    });
  }

  return badges;
}

/**
 * Extract allergen name from reason text
 */
function extractAllergenName(reasonText: string): string {
  // Extract allergen name from text like "Contains allergen: peanuts"
  const match = reasonText.match(/allergen[:\s]+([a-z]+)/i);
  if (match && match[1]) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  return 'Allergen';
}

export default router;
