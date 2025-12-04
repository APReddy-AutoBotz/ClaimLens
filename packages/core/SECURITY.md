# ClaimLens Security Implementation

This document describes the security features implemented in the ClaimLens system.

## Overview

The security implementation covers four main areas:
1. **Input Sanitization** - Unicode normalization, HTML sanitization, length validation
2. **SSRF Defense** - URL validation, host allowlisting, private IP blocking
3. **Secrets Management** - Encryption at rest, webhook secrets, key rotation
4. **Rate Limiting** - Per-IP burst limits, per-API-key limits

## Input Sanitization

### Text Sanitization (`input-sanitizer.ts`)

**Purpose**: Protect against injection attacks and ensure data integrity

**Features**:
- Unicode NFC normalization for all text inputs
- Control character removal (except newline/tab)
- Length enforcement (10KB max per field by default)
- Recursive validation for nested objects and arrays

**Usage**:
```typescript
import { sanitizeText, sanitizeHTML, validateInputLength } from '@claimlens/core';

// Sanitize plain text
const clean = sanitizeText(userInput);

// Sanitize HTML for overlays
const safeHTML = sanitizeHTML(htmlContent);

// Validate input lengths
const check = validateInputLength(requestBody);
if (!check.valid) {
  throw new Error(check.error);
}
```

**What it protects against**:
- Control character injection
- Unicode normalization attacks
- Buffer overflow via oversized inputs
- XSS via HTML injection (when using sanitizeHTML)

### HTML Sanitization

**CSP-Safe Overlay Content**:
- Removes `<script>` tags and content
- Removes event handlers (onclick, onload, etc.)
- Removes `javascript:` URLs
- Removes `data:` URLs
- Removes style expressions

**Requirements**: 18.1, 18.2

## SSRF Defense

### URL Validation (`ssrf-defense.ts`)

**Purpose**: Prevent Server-Side Request Forgery attacks on MCP services

**Features**:
- Host allowlist enforcement
- Private IP range blocking in production
- HTTPS requirement in production
- Timeout enforcement (500ms default)
- Response size limits (1MB default)

**Usage**:
```typescript
import { validateMCPUrl, safeFetch } from '@claimlens/core';

// Validate URL before use
const validation = validateMCPUrl(serviceUrl);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Safe fetch with SSRF protection
const response = await safeFetch(serviceUrl, options);
```

**Allowed Hosts** (default):
- `localhost` (development only)
- `127.0.0.1` (development only)
- `mcp.claimlens.internal`
- `mcp-services` (Docker)

**Blocked in Production**:
- Private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Link-local addresses (169.254.0.0/16)
- IPv6 private ranges (fc00::/7, fe80::/10)
- HTTP (HTTPS required)

**Requirements**: 18.3

## Secrets Management

### Encryption at Rest (`secrets-manager.ts`)

**Purpose**: Protect PII and sensitive data with per-tenant encryption

**Features**:
- AES-256-GCM encryption
- Per-tenant encryption keys
- Authenticated encryption (prevents tampering)
- Key rotation support
- Webhook secret hashing (PBKDF2)
- HMAC-SHA256 webhook signatures

**Usage**:
```typescript
import {
  generateTenantKey,
  encryptPII,
  decryptPII,
  generateWebhookSignature,
  verifyWebhookSignature,
} from '@claimlens/core';

// Generate tenant key (do once per tenant)
const keyBase64 = generateTenantKey('tenant-1');
// Store keyBase64 securely (e.g., AWS KMS, HashiCorp Vault)

// Encrypt PII before storing
const encrypted = encryptPII('tenant-1', 'user@example.com');

// Decrypt when needed
const decrypted = decryptPII('tenant-1', encrypted);

// Webhook signatures
const payload = JSON.stringify(webhookData);
const signature = generateWebhookSignature(payload, webhookSecret);

// Verify incoming webhooks
const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
```

**Key Rotation**:
```typescript
import { rotateTenantKey } from '@claimlens/core';

await rotateTenantKey('tenant-1', async (decrypt, encrypt) => {
  // Re-encrypt all PII data
  for (const record of piiRecords) {
    const plaintext = decrypt(record.encrypted_field);
    record.encrypted_field = encrypt(plaintext);
    await db.update(record);
  }
});
```

**Key Rotation Policy**:
- Rotate every 90 days (recommended)
- Alert at 85 days (5-day warning)
- Emergency rotation within 24 hours of compromise
- Archive old keys for 30 days (recovery)

**Requirements**: 22.3

## Rate Limiting

### Redis-Based Rate Limiter (`rate-limiter.ts`)

**Purpose**: Prevent abuse and ensure fair resource allocation

**Features**:
- Per-IP burst limiting (10 req/s)
- Per-API-key limiting (100 req/min)
- Automatic retry-after headers
- In-memory fallback for testing

**Limits**:
- **Burst**: 10 requests per second per IP
- **API Key**: 100 requests per minute per key
- **Export**: 10 requests per hour (separate endpoint)

**Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please slow down."
  },
  "correlation_id": "uuid",
  "retry_after": 60
}
```

**Requirements**: 18.4, 25.5

## Middleware Integration

### Input Validation Middleware (`input-validation.ts`)

Automatically applied to all API routes:

```typescript
import { validatePayloadSize, sanitizeRequestBody } from './middleware/input-validation';

app.use(validatePayloadSize);
app.use(sanitizeRequestBody);
```

**Features**:
- Payload size validation (1MB max)
- Automatic input sanitization
- Length validation
- MenuItem-specific sanitization

## Security Testing

### Test Coverage

**Unit Tests**:
- `input-sanitizer.spec.ts` - 21 tests
- `ssrf-defense.spec.ts` - 14 tests (1 skipped)
- `secrets-manager.spec.ts` - 20 tests

**Integration Tests**:
- `security.integration.spec.ts` - 21 tests

**Total**: 76 tests (75 passing, 1 skipped)

### Test Scenarios

**Input Sanitization**:
- Unicode normalization attacks
- Control character injection
- XSS attempts
- SQL injection attempts
- Deeply nested HTML
- Obfuscated event handlers

**SSRF Prevention**:
- Localhost bypass attempts
- Private network access
- AWS metadata endpoint
- Host allowlist enforcement

**Encryption**:
- Email encryption
- Phone number encryption
- Postal code encryption
- Tenant isolation
- Tamper detection

**Rate Limiting**:
- Burst limit enforcement
- API key limit enforcement
- Per-IP isolation

**Webhook Security**:
- Signature verification
- Tampered payload detection
- Replay attack prevention
- Timing-safe comparison

## Security Best Practices

### For Developers

1. **Always sanitize user input**:
   ```typescript
   const clean = sanitizeText(req.body.name);
   ```

2. **Validate before processing**:
   ```typescript
   const check = validateInputLength(req.body);
   if (!check.valid) return res.status(400).json({ error: check.error });
   ```

3. **Use safeFetch for external calls**:
   ```typescript
   const response = await safeFetch(mcpUrl);
   ```

4. **Encrypt PII at rest**:
   ```typescript
   const encrypted = encryptPII(tenantId, piiData);
   ```

5. **Verify webhook signatures**:
   ```typescript
   if (!verifyWebhookSignature(payload, signature, secret)) {
     return res.status(401).json({ error: 'Invalid signature' });
   }
   ```

### For Operations

1. **Rotate encryption keys every 90 days**
2. **Monitor rate limit violations**
3. **Review SSRF allowlist regularly**
4. **Audit webhook secret changes**
5. **Test key rotation procedures**

## Compliance

This implementation addresses the following security requirements:

- **18.1**: Unicode NFC normalization for all text inputs
- **18.2**: HTML sanitization for CSP-safe overlays
- **18.3**: SSRF defense with host allowlisting
- **18.4**: Rate limiting (100 req/min per key, 10 req/s per IP)
- **22.3**: Per-tenant encryption keys (AES-256)
- **25.5**: 429 responses with Retry-After headers

## Future Enhancements

1. **Key Management Service Integration**:
   - AWS KMS for key storage
   - HashiCorp Vault for secrets
   - Automatic key rotation

2. **Advanced Rate Limiting**:
   - Adaptive rate limits based on behavior
   - Distributed rate limiting (Redis Cluster)
   - Per-tenant custom limits

3. **Security Monitoring**:
   - Real-time attack detection
   - Anomaly detection
   - Security event logging

4. **Additional Protections**:
   - Content Security Policy headers
   - CORS configuration
   - Request signing
   - API versioning

## References

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [NIST Encryption Guidelines](https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final)
- [Unicode Security Considerations](https://unicode.org/reports/tr36/)
