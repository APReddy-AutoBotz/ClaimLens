/**
 * Webhook Manager
 * Handles webhook delivery with retry logic and HMAC signature
 */

import crypto from 'crypto';
import { Verdict } from './types';
import { Logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface WebhookPayload {
  event: 'verdict.generated';
  timestamp: string;
  tenant: string;
  verdict: 'allow' | 'modify' | 'block';
  item_id: string;
  reasons: Array<{
    transform: string;
    why: string;
    source?: string;
  }>;
  audit_id: string;
  correlation_id: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  tenant: string;
  webhook_url: string;
  payload: WebhookPayload;
  signature: string;
  attempt_count: number;
  status: 'pending' | 'delivered' | 'failed';
  last_attempt_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
}

// ============================================================================
// Webhook Manager
// ============================================================================

export class WebhookManager {
  private logger: Logger;
  private deliveryRecords: Map<string, WebhookDeliveryRecord> = new Map();
  private maxRetries = 5;
  private retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff in ms

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    
    // timingSafeEqual requires buffers of same length
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Create webhook payload from verdict
   */
  createPayload(
    tenant: string,
    verdict: Verdict,
    itemId: string
  ): WebhookPayload {
    return {
      event: 'verdict.generated',
      timestamp: new Date().toISOString(),
      tenant,
      verdict: verdict.verdict,
      item_id: itemId,
      reasons: verdict.reasons,
      audit_id: verdict.audit_id,
      correlation_id: verdict.correlation_id,
    };
  }

  /**
   * Deliver webhook with retry logic
   */
  async deliverWebhook(
    config: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryRecord> {
    const recordId = crypto.randomUUID();
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, config.secret);

    const record: WebhookDeliveryRecord = {
      id: recordId,
      tenant: payload.tenant,
      webhook_url: config.url,
      payload,
      signature,
      attempt_count: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.deliveryRecords.set(recordId, record);

    // Start delivery with retries
    await this.attemptDelivery(record, config, payloadString);

    return record;
  }

  /**
   * Attempt delivery with exponential backoff retry
   */
  private async attemptDelivery(
    record: WebhookDeliveryRecord,
    config: WebhookConfig,
    payloadString: string
  ): Promise<void> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      record.attempt_count = attempt + 1;
      record.last_attempt_at = new Date().toISOString();

      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': record.signature,
            'X-Webhook-Event': 'verdict.generated',
          },
          body: payloadString,
        });

        if (response.ok) {
          record.status = 'delivered';
          record.delivered_at = new Date().toISOString();

          this.logger.log({
            level: 'info',
            request_id: record.payload.correlation_id,
            tenant: record.tenant,
            metadata: {
              webhook_id: record.id,
              attempt: record.attempt_count,
              status: 'delivered',
            },
          });

          return;
        } else {
          const errorText = await response.text();
          record.error_message = `HTTP ${response.status}: ${errorText}`;

          this.logger.log({
            level: 'warn',
            request_id: record.payload.correlation_id,
            tenant: record.tenant,
            metadata: {
              webhook_id: record.id,
              attempt: record.attempt_count,
              status: 'failed',
              error: record.error_message,
            },
          });
        }
      } catch (error) {
        record.error_message = error instanceof Error ? error.message : 'Unknown error';

        this.logger.log({
          level: 'warn',
          request_id: record.payload.correlation_id,
          tenant: record.tenant,
          metadata: {
            webhook_id: record.id,
            attempt: record.attempt_count,
            status: 'failed',
            error: record.error_message,
          },
        });
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.maxRetries - 1) {
        await this.sleep(this.retryDelays[attempt]);
      }
    }

    // Mark as failed after all retries exhausted
    record.status = 'failed';

    this.logger.log({
      level: 'error',
      request_id: record.payload.correlation_id,
      tenant: record.tenant,
      metadata: {
        webhook_id: record.id,
        attempt: record.attempt_count,
        status: 'failed_permanently',
        error: record.error_message,
      },
    });
  }

  /**
   * Manually retry a failed webhook delivery
   */
  async retryDelivery(recordId: string, config: WebhookConfig): Promise<boolean> {
    const record = this.deliveryRecords.get(recordId);

    if (!record) {
      throw new Error(`Webhook delivery record ${recordId} not found`);
    }

    if (record.status === 'delivered') {
      return true; // Already delivered
    }

    // Reset for retry
    record.status = 'pending';
    record.attempt_count = 0;
    record.error_message = undefined;

    const payloadString = JSON.stringify(record.payload);
    await this.attemptDelivery(record, config, payloadString);

    // Status is updated by attemptDelivery to 'delivered' or 'failed'
    return (record.status as WebhookDeliveryRecord['status']) === 'delivered';
  }

  /**
   * Get delivery record by ID
   */
  getDeliveryRecord(recordId: string): WebhookDeliveryRecord | undefined {
    return this.deliveryRecords.get(recordId);
  }

  /**
   * Get delivery records for a tenant
   */
  getDeliveryRecordsByTenant(tenant: string): WebhookDeliveryRecord[] {
    return Array.from(this.deliveryRecords.values())
      .filter(record => record.tenant === tenant)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  /**
   * Get delivery statistics for a tenant
   */
  getDeliveryStats(tenant: string): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const records = this.getDeliveryRecordsByTenant(tenant);
    const total = records.length;
    const delivered = records.filter(r => r.status === 'delivered').length;
    const failed = records.filter(r => r.status === 'failed').length;
    const pending = records.filter(r => r.status === 'pending').length;
    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      delivered,
      failed,
      pending,
      successRate,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear delivery records (for testing)
   */
  clearRecords(): void {
    this.deliveryRecords.clear();
  }
}

