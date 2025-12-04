# Webhooks — ClaimLens

## Overview

ClaimLens sends webhook notifications for menu validation events, allowing customers to integrate ClaimLens verdicts into their systems.

---

## 1. Webhook Events

### Available Events

```typescript
enum WebhookEvent {
  MENU_ITEM_ALLOW = 'menu.item.allow',
  MENU_ITEM_MODIFY = 'menu.item.modify',
  MENU_ITEM_BLOCK = 'menu.item.block',
  VERDICT_GENERATED = 'verdict.generated'
}
```

### Event Descriptions

| Event | Description | When Fired |
|-------|-------------|------------|
| `menu.item.allow` | Item passed validation | Verdict = allow |
| `menu.item.modify` | Item needs modifications | Verdict = modify |
| `menu.item.block` | Item blocked | Verdict = block |
| `verdict.generated` | Any verdict generated | All verdicts |

---

## 2. Webhook Configuration

### POST /v1/webhooks/config

```typescript
interface WebhookConfig {
  url: string;                    // HTTPS required
  events: WebhookEvent[];         // Events to subscribe to
  secret: string;                 // For HMAC signature
  enabled: boolean;               // Enable/disable
  retry_policy?: {
    max_attempts: number;         // Default: 5
    backoff_multiplier: number;   // Default: 2
    initial_delay_ms: number;     // Default: 1000
  };
}
```

### Request Example

```bash
curl -X POST https://api.claimlens.com/v1/webhooks/config \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/claimlens/webhook",
    "events": ["verdict.generated"],
    "secret": "your-webhook-secret-key",
    "enabled": true
  }'
```

### Response

```json
{
  "webhook_id": "wh_1234567890",
  "url": "https://your-domain.com/claimlens/webhook",
  "events": ["verdict.generated"],
  "enabled": true,
  "created_at": "2025-11-02T10:30:00Z"
}
```

---

## 3. Webhook Payload

### Structure

```typescript
interface WebhookPayload {
  event: WebhookEvent;
  ts: string;                     // ISO 8601 timestamp
  tenant: string;
  data: {
    item_id: string;
    verdict: 'allow' | 'modify' | 'block';
    reasons: Reason[];
    changes?: Change[];
    audit_id: string;
    correlation_id: string;
  };
}
```

### Example: menu.item.modify

```json
{
  "event": "menu.item.modify",
  "ts": "2025-11-02T10:30:00.123Z",
  "tenant": "tenant-001",
  "data": {
    "item_id": "item-12345",
    "verdict": "modify",
    "reasons": [
      {
        "transform": "rewrite.disclaimer",
        "why": "Detected banned claim: superfood",
        "source": "https://fssai.gov.in/claims-guidelines"
      },
      {
        "transform": "detect.allergens",
        "why": "Contains allergen: peanuts",
        "source": "packs/allergens.in.yaml"
      }
    ],
    "changes": [
      {
        "field": "name",
        "before": "Superfood Power Bowl",
        "after": "Nutrient-rich Power Bowl (This claim has not been evaluated by FSSAI)"
      }
    ],
    "audit_id": "audit-1761982866500",
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Example: menu.item.allow

```json
{
  "event": "menu.item.allow",
  "ts": "2025-11-02T10:31:00.456Z",
  "tenant": "tenant-001",
  "data": {
    "item_id": "item-12346",
    "verdict": "allow",
    "reasons": [],
    "audit_id": "audit-1761982866501",
    "correlation_id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### Example: menu.item.block

```json
{
  "event": "menu.item.block",
  "ts": "2025-11-02T10:32:00.789Z",
  "tenant": "tenant-001",
  "data": {
    "item_id": "item-12347",
    "verdict": "block",
    "reasons": [
      {
        "transform": "rewrite.disclaimer",
        "why": "Multiple banned claims detected",
        "source": "packs/banned.claims.in.yaml"
      },
      {
        "transform": "detect.allergens",
        "why": "Allergen mismatch: declared 'nut-free' but contains peanuts",
        "source": "packs/allergens.in.yaml"
      }
    ],
    "audit_id": "audit-1761982866502",
    "correlation_id": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

---

## 4. HMAC Signature

### Signature Generation

```typescript
import crypto from 'crypto';

function generateSignature(payload: WebhookPayload, secret: string): string {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}
```

### Headers

```
POST /claimlens/webhook HTTP/1.1
Host: your-domain.com
Content-Type: application/json
X-ClaimLens-Signature: sha256=a1b2c3d4e5f6...
X-ClaimLens-Event: menu.item.modify
X-ClaimLens-Timestamp: 2025-11-02T10:30:00.123Z
X-ClaimLens-Webhook-ID: wh_1234567890
```

### Signature Verification

```typescript
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(JSON.parse(payload), secret);
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in webhook endpoint
app.post('/claimlens/webhook', (req, res) => {
  const signature = req.headers['x-claimlens-signature'] as string;
  const secret = process.env.CLAIMLENS_WEBHOOK_SECRET!;
  
  const valid = verifySignature(
    JSON.stringify(req.body),
    signature,
    secret
  );
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { event, data } = req.body;
  console.log(`Received event: ${event}`, data);
  
  res.status(200).json({ received: true });
});
```

---

## 5. Retry Policy

### Exponential Backoff

```typescript
interface RetryConfig {
  max_attempts: number;           // Default: 5
  backoff_multiplier: number;     // Default: 2
  initial_delay_ms: number;       // Default: 1000
  max_delay_ms: number;           // Default: 16000
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initial_delay_ms * Math.pow(config.backoff_multiplier, attempt - 1);
  return Math.min(delay, config.max_delay_ms);
}

// Retry schedule
// Attempt 1: 1000ms (1s)
// Attempt 2: 2000ms (2s)
// Attempt 3: 4000ms (4s)
// Attempt 4: 8000ms (8s)
// Attempt 5: 16000ms (16s)
```

### Retry Implementation

```typescript
class WebhookDeliveryManager {
  async deliverWebhook(
    config: WebhookConfig,
    payload: WebhookPayload
  ): Promise<void> {
    const retryConfig = config.retry_policy || {
      max_attempts: 5,
      backoff_multiplier: 2,
      initial_delay_ms: 1000,
      max_delay_ms: 16000
    };
    
    for (let attempt = 1; attempt <= retryConfig.max_attempts; attempt++) {
      try {
        await this.sendWebhook(config, payload);
        
        // Success - log and return
        logger.info('Webhook delivered successfully', {
          webhook_id: config.webhook_id,
          event: payload.event,
          attempt
        });
        
        return;
      } catch (error) {
        logger.warn('Webhook delivery failed', {
          webhook_id: config.webhook_id,
          event: payload.event,
          attempt,
          error: error.message
        });
        
        // Last attempt - mark as failed
        if (attempt === retryConfig.max_attempts) {
          await this.markWebhookFailed(config, payload, error);
          throw error;
        }
        
        // Wait before retry
        const delay = calculateDelay(attempt, retryConfig);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  private async sendWebhook(
    config: WebhookConfig,
    payload: WebhookPayload
  ): Promise<void> {
    const signature = generateSignature(payload, config.secret);
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ClaimLens-Signature': signature,
        'X-ClaimLens-Event': payload.event,
        'X-ClaimLens-Timestamp': payload.ts,
        'X-ClaimLens-Webhook-ID': config.webhook_id
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
    }
  }
  
  private async markWebhookFailed(
    config: WebhookConfig,
    payload: WebhookPayload,
    error: Error
  ): Promise<void> {
    await db.insert('webhook_failures', {
      webhook_id: config.webhook_id,
      event: payload.event,
      payload: JSON.stringify(payload),
      error: error.message,
      failed_at: new Date(),
      retry_count: config.retry_policy?.max_attempts || 5
    });
    
    // Optionally disable webhook after repeated failures
    const recentFailures = await db.query(`
      SELECT COUNT(*) as count
      FROM webhook_failures
      WHERE webhook_id = $1
      AND failed_at > NOW() - INTERVAL '1 hour'
    `, [config.webhook_id]);
    
    if (recentFailures[0].count >= 10) {
      await db.update('webhooks', {
        enabled: false,
        disabled_reason: 'Too many failures',
        disabled_at: new Date()
      }, { webhook_id: config.webhook_id });
      
      logger.error('Webhook disabled due to repeated failures', {
        webhook_id: config.webhook_id
      });
    }
  }
}
```

---

## 6. Webhook Delivery Dashboard

### GET /v1/webhooks/status

```typescript
interface WebhookStatus {
  webhook_id: string;
  url: string;
  enabled: boolean;
  events: WebhookEvent[];
  stats: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    success_rate: number;
    last_delivery_at?: string;
    last_failure_at?: string;
  };
  recent_failures: WebhookFailure[];
}
```

### Response Example

```json
{
  "webhook_id": "wh_1234567890",
  "url": "https://your-domain.com/claimlens/webhook",
  "enabled": true,
  "events": ["verdict.generated"],
  "stats": {
    "total_deliveries": 1523,
    "successful_deliveries": 1498,
    "failed_deliveries": 25,
    "success_rate": 0.9836,
    "last_delivery_at": "2025-11-02T10:30:00Z",
    "last_failure_at": "2025-11-01T15:22:00Z"
  },
  "recent_failures": [
    {
      "event": "menu.item.modify",
      "failed_at": "2025-11-01T15:22:00Z",
      "error": "Connection timeout",
      "retry_count": 5
    }
  ]
}
```

---

## 7. Manual Retry

### POST /v1/webhooks/retry/:failure_id

```bash
curl -X POST https://api.claimlens.com/v1/webhooks/retry/fail_123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response

```json
{
  "failure_id": "fail_123",
  "status": "retrying",
  "message": "Webhook delivery queued for retry"
}
```

---

## 8. Testing Webhooks

### Webhook Test Endpoint

```bash
curl -X POST https://api.claimlens.com/v1/webhooks/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": "wh_1234567890",
    "event": "menu.item.allow"
  }'
```

### Test Payload

```json
{
  "event": "menu.item.allow",
  "ts": "2025-11-02T10:30:00.000Z",
  "tenant": "tenant-001",
  "data": {
    "item_id": "test-item-001",
    "verdict": "allow",
    "reasons": [],
    "audit_id": "test-audit-001",
    "correlation_id": "test-correlation-001"
  }
}
```

---

## 9. Webhook Consumer Example

### Node.js/Express

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

app.post('/claimlens/webhook', (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-claimlens-signature'] as string;
  const secret = process.env.CLAIMLENS_WEBHOOK_SECRET!;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Check timestamp (prevent replay attacks)
  const timestamp = req.headers['x-claimlens-timestamp'] as string;
  const age = Date.now() - new Date(timestamp).getTime();
  
  if (age > 5 * 60 * 1000) { // 5 minutes
    return res.status(400).json({ error: 'Timestamp too old' });
  }
  
  // 3. Process webhook
  const { event, data } = req.body;
  
  switch (event) {
    case 'menu.item.allow':
      handleItemAllowed(data);
      break;
    case 'menu.item.modify':
      handleItemModified(data);
      break;
    case 'menu.item.block':
      handleItemBlocked(data);
      break;
    default:
      console.warn(`Unknown event: ${event}`);
  }
  
  // 4. Respond quickly (process async if needed)
  res.status(200).json({ received: true });
});

function handleItemAllowed(data: any) {
  console.log(`Item ${data.item_id} allowed`);
  // Update database, trigger workflow, etc.
}

function handleItemModified(data: any) {
  console.log(`Item ${data.item_id} needs modifications:`, data.changes);
  // Apply suggested changes, notify editor, etc.
}

function handleItemBlocked(data: any) {
  console.log(`Item ${data.item_id} blocked:`, data.reasons);
  // Remove from menu, notify compliance team, etc.
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

### Python/Flask

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import json
from datetime import datetime, timedelta

app = Flask(__name__)

@app.route('/claimlens/webhook', methods=['POST'])
def webhook():
    # 1. Verify signature
    signature = request.headers.get('X-ClaimLens-Signature')
    secret = os.environ['CLAIMLENS_WEBHOOK_SECRET']
    
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # 2. Check timestamp
    timestamp = request.headers.get('X-ClaimLens-Timestamp')
    age = datetime.now() - datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    
    if age > timedelta(minutes=5):
        return jsonify({'error': 'Timestamp too old'}), 400
    
    # 3. Process webhook
    payload = request.json
    event = payload['event']
    data = payload['data']
    
    if event == 'menu.item.allow':
        handle_item_allowed(data)
    elif event == 'menu.item.modify':
        handle_item_modified(data)
    elif event == 'menu.item.block':
        handle_item_blocked(data)
    
    return jsonify({'received': True}), 200

def handle_item_allowed(data):
    print(f"Item {data['item_id']} allowed")

def handle_item_modified(data):
    print(f"Item {data['item_id']} needs modifications: {data['changes']}")

def handle_item_blocked(data):
    print(f"Item {data['item_id']} blocked: {data['reasons']}")

if __name__ == '__main__':
    app.run(port=3000)
```

---

## 10. Troubleshooting

### Common Issues

**Issue:** Webhook not receiving events
- Check webhook is enabled: `GET /v1/webhooks/status`
- Verify URL is accessible from ClaimLens servers
- Check firewall rules allow incoming requests
- Verify HTTPS certificate is valid

**Issue:** Signature verification fails
- Ensure secret matches configuration
- Check body is not modified before verification
- Use raw body (not parsed JSON) for signature
- Verify constant-time comparison

**Issue:** High failure rate
- Check endpoint response time (<10s)
- Verify endpoint returns 2xx status code
- Check for rate limiting on your side
- Review error logs in webhook dashboard

### Debug Mode

```bash
# Enable webhook debug logging
curl -X PATCH https://api.claimlens.com/v1/webhooks/wh_1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"debug": true}'
```

---

## 11. References

- [Webhook Best Practices](https://webhooks.fyi/)
- [HMAC Signature Verification](https://www.oauth.com/oauth2-servers/signing-requests/hmac/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
