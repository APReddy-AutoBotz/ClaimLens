/**
 * Metrics endpoint for Prometheus scraping
 */
import { Router } from 'express';
import { registry } from '../../../packages/core/metrics';
const router = Router();
/**
 * GET /metrics
 * Expose Prometheus-compatible metrics
 */
router.get('/', (req, res) => {
    try {
        const metrics = registry.export();
        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'METRICS_ERROR',
                message: 'Failed to export metrics',
            },
        });
    }
});
export default router;
