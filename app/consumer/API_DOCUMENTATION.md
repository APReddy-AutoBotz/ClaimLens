# Consumer API Documentation

## POST /v1/consumer/scan

Analyzes food products and returns trust score, verdict, and detailed issues.

### Endpoint
```
POST /v1/consumer/scan
```

### Headers
```
Content-Type: application/json
X-Correlation-ID: <uuid> (optional, auto-generated if not provided)
Idempotency-Key: <uuid> (optional, for duplicate prevention)
```

### Request Body

```typescript
{
  input_type: 'url' | 'screenshot' | 'text' | 'barcode';
  input_data: string;
  locale?: string;
  allergen_profile?: string[];
}
```

#### Fields

- **input_type** (required): Type of input
  - `url`: Web page URL
  - `screenshot`: Base64-encoded image
  - `text`: Plain text content
  - `barcode`: Barcode number

- **input_data** (required): Input data
  - For `url`: Valid HTTP/HTTPS URL
  - For `screenshot`: Base64-encoded image (max 5MB)
  - For `text`: Plain text (max 10KB)
  - For `barcode`: Barcode number (UPC, EAN)

- **locale** (optional): Locale code (default: `en-IN`)
  - Supported: `en-IN`, `en-US`, `en-GB`, `hi-IN`, `ta-IN`

- **allergen_profile** (optional): Array of allergen names
  - Example: `["Peanuts", "Milk", "Wheat"]`

### Response

```typescript
{
  trust_score: number;
  verdict: {
    label: 'allow' | 'caution' | 'avoid';
    color: string;
    icon: string;
    explanation: string;
  };
  badges: Array<{
    kind: 'warn' | 'danger' | 'ok';
    label: string;
    explanation: string;
    source?: string;
  }>;
  reasons: Array<{
    transform: string;
    why: string;
    source?: string;
  }>;
  suggestions?: Array<{
    name: string;
    trust_score: number;
    key_differences: string[];
  }>;
  breakdown?: {
    base: number;
    banned_claims: number;
    recalls: number;
    allergens: number;
    weasel_words: number;
    clean_bonus: number;
    final: number;
  };
  user_allergens_detected?: string[];
  correlation_id: string;
}
```

### Examples

#### Example 1: Text Input

**Request:**
```json
POST /v1/consumer/scan
Content-Type: application/json

{
  "input_type": "text",
  "input_data": "Organic superfood smoothie with natural detox properties. Contains wheat and soy.",
  "locale": "en-IN",
  "allergen_profile": ["Wheat"]
}
```

**Response:**
```json
{
  "trust_score": 40,
  "verdict": {
    "label": "avoid",
    "color": "#EF4444",
    "icon": "✕",
    "explanation": "This product has significant concerns"
  },
  "badges": [
    {
      "kind": "danger",
      "label": "Banned Claim: Superfood",
      "explanation": "The term 'superfood' is not scientifically defined and is prohibited by FSSAI",
      "source": "https://fssai.gov.in/claims"
    },
    {
      "kind": "danger",
      "label": "Banned Claim: Detox",
      "explanation": "Detox claims are not substantiated and are prohibited",
      "source": "https://fssai.gov.in/claims"
    },
    {
      "kind": "warn",
      "label": "Allergen: Wheat",
      "explanation": "Contains wheat, which is in your allergen profile",
      "source": "User allergen profile"
    }
  ],
  "reasons": [
    {
      "transform": "detect.banned_claims",
      "why": "Found 2 banned health claims",
      "source": "https://fssai.gov.in/claims"
    },
    {
      "transform": "detect.allergens",
      "why": "Found 1 user allergen",
      "source": "User allergen profile"
    }
  ],
  "breakdown": {
    "base": 100,
    "banned_claims": -80,
    "recalls": 0,
    "allergens": -20,
    "weasel_words": 0,
    "clean_bonus": 0,
    "final": 40
  },
  "user_allergens_detected": ["Wheat"],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Example 2: URL Input

**Request:**
```json
POST /v1/consumer/scan
Content-Type: application/json

{
  "input_type": "url",
  "input_data": "https://example.com/product/organic-oats",
  "locale": "en-US"
}
```

**Response:**
```json
{
  "trust_score": 110,
  "verdict": {
    "label": "allow",
    "color": "#10B981",
    "icon": "✓",
    "explanation": "This product appears safe with minimal concerns"
  },
  "badges": [
    {
      "kind": "ok",
      "label": "Clean Product",
      "explanation": "No issues detected",
      "source": null
    }
  ],
  "reasons": [],
  "breakdown": {
    "base": 100,
    "banned_claims": 0,
    "recalls": 0,
    "allergens": 0,
    "weasel_words": 0,
    "clean_bonus": 10,
    "final": 110
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### Example 3: Barcode Input

**Request:**
```json
POST /v1/consumer/scan
Content-Type: application/json

{
  "input_type": "barcode",
  "input_data": "8901234567890",
  "locale": "en-IN"
}
```

**Response:**
```json
{
  "trust_score": 85,
  "verdict": {
    "label": "allow",
    "color": "#10B981",
    "icon": "✓",
    "explanation": "This product appears safe with minimal concerns"
  },
  "badges": [
    {
      "kind": "warn",
      "label": "Weasel Words",
      "explanation": "Contains vague marketing language like 'may help' and 'supports'",
      "source": "Marketing analysis"
    }
  ],
  "reasons": [
    {
      "transform": "detect.weasel_words",
      "why": "Found moderate density of weasel words (12%)",
      "source": "Marketing analysis"
    }
  ],
  "suggestions": [
    {
      "name": "Alternative Organic Oats",
      "trust_score": 110,
      "key_differences": ["No vague claims", "Clean ingredients"]
    }
  ],
  "breakdown": {
    "base": 100,
    "banned_claims": 0,
    "recalls": 0,
    "allergens": 0,
    "weasel_words": -15,
    "clean_bonus": 0,
    "final": 85
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid input",
  "message": "Text input exceeds 10KB limit",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 100 requests per minute",
  "retry_after": 30,
  "correlation_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440005"
}
```

### Rate Limits

- **100 requests per minute** per IP address
- **1000 requests per hour** per IP address

### Performance

- **p50 latency:** <500ms
- **p95 latency:** <2s
- **p99 latency:** <3s

### Caching

- Barcode lookups are cached for **7 days**
- URL content is cached for **1 hour**
- Cache key includes input data and allergen profile

### Privacy

- **No server-side storage** by default
- Scan data is processed in-memory and discarded
- Allergen profile is not transmitted unless explicitly included in request
- All requests are logged with correlation ID for debugging (no PII)

### Integration Example

```typescript
async function scanProduct(text: string, allergens: string[]) {
  const response = await fetch('http://localhost:3000/v1/consumer/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': crypto.randomUUID(),
    },
    body: JSON.stringify({
      input_type: 'text',
      input_data: text,
      locale: 'en-IN',
      allergen_profile: allergens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scan failed: ${response.statusText}`);
  }

  return await response.json();
}

// Usage
const result = await scanProduct(
  'Organic oats with natural fiber',
  ['Wheat', 'Milk']
);

console.log(`Trust Score: ${result.trust_score}`);
console.log(`Verdict: ${result.verdict.label}`);
```

## Related Documentation

- [Trust Score Algorithm](./TRUST_SCORE_ALGORITHM.md)
- [User Guide](./USER_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
