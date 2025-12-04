/**
 * ClaimLens API Gateway
 * Entry point for MenuShield API and Admin Console API
 */

import express, { Express } from 'express';
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

export interface APIGatewayConfig {
  port?: number;
  redisUrl?: string;
}

export class APIGateway {
  private app: Express;
  private rateLimiter: RateLimiter;
  private idempotencyManager: IdempotencyManager;
  private server: any;

  constructor(config: APIGatewayConfig = {}) {
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
  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '1mb' }));

    // Correlation ID generation and propagation
    this.app.use(correlationId as any);

    // Rate limiting (applies to all routes)
    this.app.use(this.rateLimiter.middleware() as any);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
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
    this.app.use('/v1/menu', authenticateBearer as any, menuRoutes);

    // Export API routes (require authentication)
    this.app.use('/v1/export', authenticateBearer as any, exportRoutes);

    // Admin Console API routes (require authentication)
    this.app.use('/v1/admin', authenticateBearer as any, adminRoutes);

    // Web API routes for ClaimLens Go extension (require authentication)
    this.app.use('/v1/web', authenticateBearer as any, webRoutes);

    // Webhook configuration routes (require authentication)
    this.app.use('/v1/webhooks', authenticateBearer as any, webhookRoutes);

    // Consumer API routes (no authentication required for B2C)
    this.app.use('/v1/consumer', consumerRoutes);
  }

  /**
   * Setup error handlers (must be last)
   */
  private setupErrorHandlers(): void {
    // 404 handler
    this.app.use(notFoundHandler as any);

    // Global error handler
    this.app.use(errorHandler as any);
  }

  /**
   * Start the API Gateway server
   */
  async start(port: number = 8080): Promise<void> {
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
  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
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
  getApp(): Express {
    return this.app;
  }

  /**
   * Reset rate limiter (for testing)
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }

  /**
   * Get IdempotencyManager instance (for testing)
   */
  getIdempotencyManager(): IdempotencyManager {
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
