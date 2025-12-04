/**
 * ClaimLens API Gateway
 * Entry point for MenuShield API and Admin Console API
 */
import express from 'express';
import { correlationId } from './middleware/correlation';
import { authenticateBearer } from './middleware/auth';
import { RateLimiter } from './middleware/rate-limiter';
import { IdempotencyManager } from './middleware/idempotency';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import menuRoutes from './routes/menu';
import exportRoutes from './routes/export';
import adminRoutes from './routes/admin';
import webRoutes from './routes/web';
import metricsRoutes from './routes/metrics';
import webhookRoutes from './routes/webhooks';
import consumerRoutes from './routes/consumer';
export class APIGateway {
    app;
    rateLimiter;
    idempotencyManager;
    server;
    constructor(config = {}) {
        this.app = express();
        this.rateLimiter = new RateLimiter(config.redisUrl);
        this.idempotencyManager = new IdempotencyManager(config.redisUrl);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandlers();
    }
    /**
     * Setup global middleware
     */
    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json({ limit: '1mb' }));
        // Correlation ID generation and propagation
        this.app.use(correlationId);
        // Rate limiting (applies to all routes)
        this.app.use(this.rateLimiter.middleware());
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoint (no auth required)
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
            });
        });
        // Metrics endpoint (no auth required for Prometheus scraping)
        this.app.use('/metrics', metricsRoutes);
        // MenuShield API routes (require authentication)
        this.app.use('/v1/menu', authenticateBearer, menuRoutes);
        // Export API routes (require authentication)
        this.app.use('/v1/export', authenticateBearer, exportRoutes);
        // Admin Console API routes (require authentication)
        this.app.use('/v1/admin', authenticateBearer, adminRoutes);
        // Web API routes for ClaimLens Go extension (require authentication)
        this.app.use('/v1/web', authenticateBearer, webRoutes);
        // Webhook configuration routes (require authentication)
        this.app.use('/v1/webhooks', authenticateBearer, webhookRoutes);
        // Consumer API routes (no authentication required for B2C)
        this.app.use('/v1/consumer', consumerRoutes);
    }
    /**
     * Setup error handlers (must be last)
     */
    setupErrorHandlers() {
        // 404 handler
        this.app.use(notFoundHandler);
        // Global error handler
        this.app.use(errorHandler);
    }
    /**
     * Start the API Gateway server
     */
    async start(port = 8080) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`API Gateway listening on port ${port}`);
                resolve();
            });
        });
    }
    /**
     * Stop the API Gateway server
     */
    async stop() {
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => resolve());
            });
        }
        // Close Redis connections
        await this.rateLimiter.close();
        await this.idempotencyManager.close();
    }
    /**
     * Get Express app instance (for testing)
     */
    getApp() {
        return this.app;
    }
    /**
     * Reset rate limiter (for testing)
     */
    resetRateLimiter() {
        this.rateLimiter.reset();
    }
    /**
     * Get IdempotencyManager instance (for testing)
     */
    getIdempotencyManager() {
        return this.idempotencyManager;
    }
}
// Start server if run directly
if (require.main === module) {
    const gateway = new APIGateway({
        port: parseInt(process.env.PORT || '8080'),
        redisUrl: process.env.REDIS_URL,
    });
    gateway.start().catch((error) => {
        console.error('Failed to start API Gateway:', error);
        process.exit(1);
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, starting graceful shutdown');
        await gateway.stop();
        console.log('Graceful shutdown complete');
        process.exit(0);
    });
}
export default APIGateway;
