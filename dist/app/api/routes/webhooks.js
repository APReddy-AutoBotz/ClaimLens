/**
 * Webhook API Routes
 * Endpoints for webhook configuration and management
 */
import { Router } from 'express';
import { requirePermission } from '../middleware/rbac';
import { WebhookManager } from '../../../packages/core/webhook-manager';
// Initialize dependencies
const pool = {
    query: async () => ({ rows: [] }),
};
const webhookManager = new WebhookManager();
const router = Router();
/**
 * Validate webhook URL (HTTPS required)
 */
function validateWebhookUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
            return {
                valid: false,
                error: 'Webhook URL must use HTTPS protocol',
            };
        }
        return { valid: true };
    }
    catch (error) {
        return {
            valid: false,
            error: 'Invalid webhook URL format',
        };
    }
}
/**
 * POST /v1/webhooks/config
 * Configure webhook for tenant
 */
router.post('/config', requirePermission('webhooks', 'write'), (async (req, res) => {
    try {
        const { webhook_url, webhook_secret } = req.body;
        // Validate required fields
        if (!webhook_url) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'webhook_url is required',
                },
                correlation_id: req.correlationId,
            });
        }
        if (!webhook_secret) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'webhook_secret is required',
                },
                correlation_id: req.correlationId,
            });
        }
        // Validate webhook URL
        const validation = validateWebhookUrl(webhook_url);
        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error,
                },
                correlation_id: req.correlationId,
            });
        }
        // Update tenant configuration
        await pool.query(`UPDATE tenant_config 
         SET webhook_url = $1, webhook_secret = $2, updated_at = NOW()
         WHERE tenant = $3`, [webhook_url, webhook_secret, req.tenant]);
        res.json({
            success: true,
            webhook_url,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to configure webhook',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/webhooks/config
 * Get webhook configuration for tenant
 */
router.get('/config', requirePermission('webhooks', 'read'), (async (req, res) => {
    try {
        const result = await pool.query(`SELECT webhook_url, updated_at 
         FROM tenant_config 
         WHERE tenant = $1`, [req.tenant]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tenant configuration not found',
                },
                correlation_id: req.correlationId,
            });
        }
        const config = result.rows[0];
        res.json({
            webhook_url: config.webhook_url || null,
            configured: !!config.webhook_url,
            updated_at: config.updated_at,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve webhook configuration',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * DELETE /v1/webhooks/config
 * Remove webhook configuration for tenant
 */
router.delete('/config', requirePermission('webhooks', 'write'), (async (req, res) => {
    try {
        await pool.query(`UPDATE tenant_config 
         SET webhook_url = NULL, webhook_secret = NULL, updated_at = NOW()
         WHERE tenant = $1`, [req.tenant]);
        res.json({
            success: true,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to remove webhook configuration',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/webhooks/deliveries
 * Get webhook delivery history for tenant
 */
router.get('/deliveries', requirePermission('webhooks', 'read'), (async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const records = webhookManager
            .getDeliveryRecordsByTenant(req.tenant)
            .slice(0, limit);
        const stats = webhookManager.getDeliveryStats(req.tenant);
        res.json({
            deliveries: records,
            stats,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve webhook deliveries',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * POST /v1/webhooks/deliveries/:id/retry
 * Manually retry a failed webhook delivery
 */
router.post('/deliveries/:id/retry', requirePermission('webhooks', 'write'), (async (req, res) => {
    try {
        const { id } = req.params;
        // Get delivery record
        const record = webhookManager.getDeliveryRecord(id);
        if (!record) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: `Webhook delivery ${id} not found`,
                },
                correlation_id: req.correlationId,
            });
        }
        // Verify tenant access
        if (record.tenant !== req.tenant) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this webhook delivery',
                },
                correlation_id: req.correlationId,
            });
        }
        // Get webhook config
        const configResult = await pool.query(`SELECT webhook_url, webhook_secret 
         FROM tenant_config 
         WHERE tenant = $1`, [req.tenant]);
        if (configResult.rows.length === 0 || !configResult.rows[0].webhook_url) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Webhook not configured for this tenant',
                },
                correlation_id: req.correlationId,
            });
        }
        const config = {
            url: configResult.rows[0].webhook_url,
            secret: configResult.rows[0].webhook_secret,
        };
        // Retry delivery
        const success = await webhookManager.retryDelivery(id, config);
        res.json({
            success,
            status: success ? 'delivered' : 'failed',
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retry webhook delivery',
            },
            correlation_id: req.correlationId,
        });
    }
}));
/**
 * GET /v1/webhooks/stats
 * Get webhook delivery statistics for tenant
 */
router.get('/stats', requirePermission('webhooks', 'read'), (async (req, res) => {
    try {
        const stats = webhookManager.getDeliveryStats(req.tenant);
        res.json({
            stats,
            correlation_id: req.correlationId,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve webhook statistics',
            },
            correlation_id: req.correlationId,
        });
    }
}));
export default router;
export { webhookManager };
