# ClaimLens — API Specification v1.0

## Base URL
```
Production: https://api.claimlens.com/v1
Staging: https://staging-api.claimlens.com/v1
```

## Authentication
All requests require API key in header:
```
Authorization: Bearer <api_key>
```

## Required Headers
```
X-Correlation-ID: <uuid>  # Required for request tracing
Content-Type: application/json
```

---

## Endpoints

### POST /v1/menu/feed
Analyze menu items using MenuShield (B2B pre-publish gate)

**Profile:** menushield_in

**Request:**
```json
{
  "items": [
    {
      "id": "item-001",
      "name": "Superfood Power Bowl",
      "description": "Amazing detox bowl",
      "ingredients": ["quinoa", "kale", "peanuts"],
      "nutrition": {
        "calories": "250 per serving",
        "sugar_g": 28,
        "sodium_mg": 650
      }
    }
  ],
  "locale": "en-IN"
}
```

**Response:**
```json
{
  "verdicts": [
    {
      "item_id": "item-001",
      "verdict": "modify",
      "changes": [
        {
          "field": "name",
          "before": "Superfood Power Bowl",
          "after": "Nutrient-rich Power Bowl (This claim has not been evaluated by FSSAI)"
        }
      ],
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
      "audit_id": "audit-1761982866500"
    }
  ],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Latency SLO:** p95 ≤ 150ms

---

### POST /v1/menu/validate
Quick validation for single item (faster, fewer transforms)

**Profile:** menushield_in (subset)

**Request:**
```json
{
  "item": {
    "id": "item-002",
    "name": "Miracle detox juice",
    "description": "Contact chef@restaurant.com"
  },
  "locale": "en-IN"
}
```

**Response:**
```json
{
  "verdict": "modify",
  "changes": [...],
  "reasons": [...],
  "audit_id": "audit-1761982866501",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Latency SLO:** p95 ≤ 100ms

---

### GET /v1/export/menu.ndjson
Export cleaned menu items in newline-delimited JSON format

**Query Parameters:**
- `cursor` (optional): Pagination cursor from previous response
- `limit` (optional): Items per page (default: 100, max: 1000)

**Response:**
```
{"id":"item-001","name":"Nutrient-rich Power Bowl (...)","..."}
{"id":"item-002","name":"Cleansing juice (...)","..."}
{"id":"item-003","name":"Fresh Fruit Salad","..."}
```

**Headers:**
```
X-Next-Cursor: eyJpZCI6Iml0ZW0tMTAwIn0=
X-Total-Count: 1523
```

**Tenant Scoping:** Automatically scoped to requesting tenant

---

### POST /v1/web/ingest
Analyze web content for ClaimLens Go (B2C overlay)

**Profile:** claimlens_go

**Request:**
```json
{
  "items": [
    {
      "id": "web-item-001",
      "name": "Superfood Smoothie Bowl",
      "description": "Amazing detox bowl with miracle ingredients",
      "dom_selector": ".menu-item[data-id='101']"
    }
  ],
  "locale": "en-IN"
}
```

**Response:**
```json
{
  "badges": [
    {
      "item_id": "web-item-001",
      "kind": "claim_warning",
      "label": "Health Claim",
      "explanation": "Contains unverified health claims. This claim has not been evaluated by FSSAI.",
      "source": "https://fssai.gov.in/claims-guidelines"
    },
    {
      "item_id": "web-item-001",
      "kind": "allergen",
      "label": "Contains: Peanuts",
      "explanation": "This item contains peanuts which may cause allergic reactions.",
      "source": "packs/allergens.in.yaml"
    }
  ],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Latency SLO:** p95 ≤ 120ms

---

### GET /v1/audits/:audit_id
Retrieve detailed audit record

**Response:**
```json
{
  "audit_id": "audit-1761982866500",
  "ts": "2025-11-01T07:41:06.502Z",
  "tenant": "tenant-001",
  "profile": "menushield_in",
  "route": "/menu/feed",
  "item_id": "item-001",
  "transforms": [
    {
      "name": "rewrite.disclaimer",
      "duration_ms": 0.08,
      "decision": "modify"
    },
    {
      "name": "redact.pii",
      "duration_ms": 0.33,
      "decision": "pass"
    }
  ],
  "verdict": {...},
  "latency_ms": 45,
  "degraded_mode": false
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_SCHEMA",
    "message": "Request body does not match MenuItem schema",
    "details": {
      "field": "nutrition.calories",
      "expected": "string or number",
      "received": "boolean"
    }
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key is missing or invalid"
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User role 'Viewer' cannot modify policies"
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440005"
}
```

### 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded"
  },
  "retry_after": 42,
  "correlation_id": "550e8400-e29b-41d4-a716-446655440006"
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440007"
}
```

**Note:** 5xx errors never expose internal implementation details

---

## Webhooks

### Configuration
POST /v1/webhooks/config
```json
{
  "url": "https://your-domain.com/claimlens/webhook",
  "events": ["verdict.generated"],
  "signature_secret": "your-secret-key"
}
```

### Webhook Payload
```json
{
  "event": "verdict.generated",
  "ts": "2025-11-01T07:41:06.502Z",
  "tenant": "tenant-001",
  "data": {
    "item_id": "item-001",
    "verdict": "modify",
    "reasons": [...],
    "audit_id": "audit-1761982866500"
  },
  "signature": "sha256=..."
}
```

### Retry Policy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum 5 attempts
- Marked as failed after 5th attempt

---

## Rate Limits

- **Per API Key:** 100 requests per minute
- **Per IP (Burst):** 10 requests per second
- **Export Endpoint:** 10 requests per hour

---

## JSON Schemas

See `claimlens-spec-design-pack/docs/SCHEMAS.json` for complete schema definitions:
- MenuItem
- Verdict
- Reason
- AuditRecord
- Badge
