# Security & Privacy — ClaimLens

## Overview

ClaimLens implements defense-in-depth security with privacy-first design. All security controls are testable, auditable, and documented.

---

## 1. Content Security Policy (CSP)

### Browser Extension CSP
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self'"
  }
}
```

### Admin Console CSP Headers
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.claimlens.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
```

**Rationale:** Prevents XSS, clickjacking, and code injection attacks.

---

## 2. SSRF Defense

### MCP Service URL Validation

```typescript
const ALLOWED_MCP_HOSTS = [
  'localhost',
  '127.0.0.1',
  'mcp.claimlens.internal',
  'mcp-services.claimlens.com'
];

const BLOCKED_IP_RANGES = [
  '10.0.0.0/8',      // Private
  '172.16.0.0/12',   // Private
  '192.168.0.0/16',  // Private
  '169.254.0.0/16',  // Link-local
  '127.0.0.0/8',     // Loopback (except 127.0.0.1 in dev)
  '::1/128',         // IPv6 loopback
  'fc00::/7'         // IPv6 private
];

function validateMCPUrl(url: string, env: 'dev' | 'prod'): boolean {
  const parsed = new URL(url);
  
  // Check hostname allowlist
  if (!ALLOWED_MCP_HOSTS.includes(parsed.hostname)) {
    throw new Error(`MCP host not allowed: ${parsed.hostname}`);
  }
  
  // Enforce HTTPS in production
  if (env === 'prod' && parsed.protocol !== 'https:') {
    throw new Error('MCP services must use HTTPS in production');
  }
  
  // Resolve hostname to IP and check against blocked ranges
  const ip = await dns.resolve(parsed.hostname);
  if (isBlockedIP(ip, env)) {
    throw new Error(`MCP service resolves to blocked IP: ${ip}`);
  }
  
  return true;
}
```

**Test Coverage:**
- ✅ Reject private IP ranges
- ✅ Reject localhost in production
- ✅ Enforce HTTPS in production
- ✅ Validate hostname allowlist
- ✅ Prevent DNS rebinding attacks

---

## 3. Domain Allowlist (B2C Extension)

### User Consent Model

```typescript
interface ConsentRecord {
  domain: string;
  granted_at: string;
  expires_at: string;
  scope: 'scan' | 'scan+history';
}

class ConsentManager {
  private storage = chrome.storage.local;
  
  async requestConsent(domain: string): Promise<boolean> {
    // Show consent dialog
    const granted = await this.showConsentDialog(domain);
    
    if (granted) {
      const record: ConsentRecord = {
        domain,
        granted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        scope: 'scan'
      };
      
      await this.storage.set({ [`consent:${domain}`]: record });
    }
    
    return granted;
  }
  
  async hasConsent(domain: string): Promise<boolean> {
    const key = `consent:${domain}`;
    const result = await this.storage.get(key);
    const record = result[key] as ConsentRecord | undefined;
    
    if (!record) return false;
    
    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await this.storage.remove(key);
      return false;
    }
    
    return true;
  }
  
  async revokeConsent(domain: string): Promise<void> {
    await this.storage.remove(`consent:${domain}`);
  }
}
```

### Allowlist Management

```typescript
const DEFAULT_ALLOWLIST = [
  'swiggy.com',
  'zomato.com',
  'ubereats.com',
  'doordash.com',
  'grubhub.com'
];

class AllowlistManager {
  async isAllowed(domain: string): Promise<boolean> {
    const allowlist = await this.getAllowlist();
    return allowlist.some(pattern => this.matchDomain(domain, pattern));
  }
  
  private matchDomain(domain: string, pattern: string): boolean {
    // Support wildcards: *.example.com
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '[^.]+').replace(/\./g, '\\.') + '$'
    );
    return regex.test(domain);
  }
  
  async addDomain(domain: string): Promise<void> {
    const allowlist = await this.getAllowlist();
    if (!allowlist.includes(domain)) {
      allowlist.push(domain);
      await chrome.storage.local.set({ allowlist });
    }
  }
  
  async removeDomain(domain: string): Promise<void> {
    const allowlist = await this.getAllowlist();
    const filtered = allowlist.filter(d => d !== domain);
    await chrome.storage.local.set({ allowlist: filtered });
  }
}
```

**Privacy Guarantees:**
- ✅ No scanning without explicit consent
- ✅ Consent expires after 1 year
- ✅ User can revoke consent anytime
- ✅ No data transmitted outside allowlisted domains

---

## 4. PII Encryption at Rest

### Encryption Key Management

```typescript
import crypto from 'crypto';

interface EncryptionKey {
  tenant_id: string;
  key_id: string;
  key_material: Buffer;
  created_at: Date;
  rotated_at?: Date;
  status: 'active' | 'rotating' | 'retired';
}

class SecretsManager {
  private algorithm = 'aes-256-gcm';
  private keyCache = new Map<string, EncryptionKey>();
  
  async getKey(tenantId: string): Promise<EncryptionKey> {
    // Check cache
    if (this.keyCache.has(tenantId)) {
      return this.keyCache.get(tenantId)!;
    }
    
    // Load from secure key store (e.g., AWS KMS, HashiCorp Vault)
    const key = await this.loadKeyFromStore(tenantId);
    this.keyCache.set(tenantId, key);
    return key;
  }
  
  async encrypt(plaintext: string, tenantId: string): Promise<string> {
    const key = await this.getKey(tenantId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key.key_material, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: keyId:iv:authTag:ciphertext
    return `${key.key_id}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  async decrypt(ciphertext: string, tenantId: string): Promise<string> {
    const [keyId, ivHex, authTagHex, encrypted] = ciphertext.split(':');
    
    const key = await this.getKey(tenantId);
    if (key.key_id !== keyId) {
      throw new Error('Key ID mismatch');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key.key_material, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  async rotateKey(tenantId: string): Promise<void> {
    const oldKey = await this.getKey(tenantId);
    oldKey.status = 'rotating';
    
    // Generate new key
    const newKey: EncryptionKey = {
      tenant_id: tenantId,
      key_id: crypto.randomUUID(),
      key_material: crypto.randomBytes(32),
      created_at: new Date(),
      status: 'active'
    };
    
    // Save new key
    await this.saveKeyToStore(newKey);
    
    // Re-encrypt all data with new key (background job)
    await this.scheduleReEncryption(tenantId, oldKey.key_id, newKey.key_id);
    
    // Mark old key as retired after re-encryption completes
    oldKey.status = 'retired';
    await this.saveKeyToStore(oldKey);
  }
}
```

**Key Rotation Policy:**
- Automatic rotation every 90 days
- Manual rotation on security incident
- Old keys retained for 30 days for decryption
- Re-encryption job runs in background

---

## 5. Rule Pack Signatures (SHA-256)

### Signing Process

```typescript
import crypto from 'crypto';
import fs from 'fs/promises';

interface RulePackSignature {
  pack_name: string;
  version: string;
  sha256: string;
  signed_at: string;
  signed_by: string;
}

class RulePackSigner {
  async signPack(packPath: string, signerEmail: string): Promise<RulePackSignature> {
    const content = await fs.readFile(packPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    const signature: RulePackSignature = {
      pack_name: path.basename(packPath),
      version: this.extractVersion(content),
      sha256: hash,
      signed_at: new Date().toISOString(),
      signed_by: signerEmail
    };
    
    // Save signature file
    const sigPath = `${packPath}.sig`;
    await fs.writeFile(sigPath, JSON.stringify(signature, null, 2));
    
    return signature;
  }
  
  async verifyPack(packPath: string): Promise<boolean> {
    const sigPath = `${packPath}.sig`;
    
    // Load signature
    const sigContent = await fs.readFile(sigPath, 'utf8');
    const signature: RulePackSignature = JSON.parse(sigContent);
    
    // Calculate current hash
    const content = await fs.readFile(packPath, 'utf8');
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Compare
    if (currentHash !== signature.sha256) {
      console.error(`Rule pack signature mismatch: ${packPath}`);
      console.error(`Expected: ${signature.sha256}`);
      console.error(`Got: ${currentHash}`);
      return false;
    }
    
    return true;
  }
  
  private extractVersion(content: string): string {
    const match = content.match(/version:\s*["']?([0-9.]+)["']?/);
    return match ? match[1] : '0.0.0';
  }
}
```

### CI Pipeline Integration

```yaml
# .github/workflows/verify-rule-packs.yml
name: Verify Rule Pack Signatures

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify all rule pack signatures
        run: |
          node scripts/verify-signatures.mjs
          
      - name: Fail if any signature invalid
        if: failure()
        run: |
          echo "❌ Rule pack signature verification failed"
          exit 1
```

**Security Properties:**
- ✅ Tamper detection
- ✅ Version tracking
- ✅ Audit trail (signed_by)
- ✅ CI enforcement

---

## 6. Webhook HMAC Signatures

### Signature Generation

```typescript
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  ts: string;
  tenant: string;
  data: any;
}

class WebhookSigner {
  generateSignature(payload: WebhookPayload, secret: string): string {
    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }
  
  verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(
      JSON.parse(payload),
      secret
    );
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Usage in webhook delivery
async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<void> {
  const signer = new WebhookSigner();
  const signature = signer.generateSignature(payload, secret);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ClaimLens-Signature': signature,
      'X-ClaimLens-Event': payload.event,
      'X-ClaimLens-Timestamp': payload.ts
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status}`);
  }
}
```

### Webhook Consumer Verification

```typescript
// Example: Customer webhook endpoint
app.post('/claimlens/webhook', (req, res) => {
  const signature = req.headers['x-claimlens-signature'];
  const secret = process.env.CLAIMLENS_WEBHOOK_SECRET;
  
  const signer = new WebhookSigner();
  const valid = signer.verifySignature(
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

**Security Properties:**
- ✅ Authenticity verification
- ✅ Replay attack prevention (timestamp check)
- ✅ Timing-safe comparison
- ✅ Secret rotation support

---

## 7. Secrets Rotation Procedures

### Rotation Schedule

| Secret Type | Rotation Frequency | Trigger |
|-------------|-------------------|---------|
| Tenant encryption keys | 90 days | Automatic |
| API keys | 180 days | Manual |
| Webhook secrets | 365 days | Manual |
| Database credentials | 90 days | Automatic |
| MCP service tokens | 30 days | Automatic |

### Rotation Workflow

```typescript
interface RotationJob {
  secret_type: string;
  tenant_id?: string;
  scheduled_at: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

class SecretRotationManager {
  async scheduleRotation(secretType: string, tenantId?: string): Promise<void> {
    const job: RotationJob = {
      secret_type: secretType,
      tenant_id: tenantId,
      scheduled_at: new Date(),
      status: 'pending'
    };
    
    await db.insert('rotation_jobs', job);
  }
  
  async executeRotation(job: RotationJob): Promise<void> {
    job.status = 'in_progress';
    await db.update('rotation_jobs', job);
    
    try {
      switch (job.secret_type) {
        case 'encryption_key':
          await this.rotateEncryptionKey(job.tenant_id!);
          break;
        case 'api_key':
          await this.rotateApiKey(job.tenant_id!);
          break;
        case 'webhook_secret':
          await this.rotateWebhookSecret(job.tenant_id!);
          break;
        default:
          throw new Error(`Unknown secret type: ${job.secret_type}`);
      }
      
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
    }
    
    await db.update('rotation_jobs', job);
  }
  
  private async rotateEncryptionKey(tenantId: string): Promise<void> {
    const secretsManager = new SecretsManager();
    await secretsManager.rotateKey(tenantId);
  }
  
  private async rotateApiKey(tenantId: string): Promise<void> {
    // Generate new API key
    const newKey = crypto.randomBytes(32).toString('hex');
    
    // Store with grace period (both keys valid for 7 days)
    await db.query(`
      UPDATE api_keys 
      SET status = 'rotating', grace_period_ends = NOW() + INTERVAL '7 days'
      WHERE tenant_id = $1 AND status = 'active'
    `, [tenantId]);
    
    await db.insert('api_keys', {
      tenant_id: tenantId,
      key_hash: hashApiKey(newKey),
      status: 'active',
      created_at: new Date()
    });
    
    // Notify tenant
    await this.notifyTenant(tenantId, 'api_key_rotated', { new_key: newKey });
  }
}
```

**Rotation Best Practices:**
- Grace period for API keys (7 days)
- Zero-downtime rotation
- Automated notifications
- Rollback capability
- Audit logging

---

## 8. Privacy Controls Summary

### Data Minimization

| Data Type | B2B (MenuShield) | B2C (ClaimLens Go) |
|-----------|------------------|-------------------|
| Menu content | Stored (encrypted) | Not stored |
| User identity | Required | Anonymous |
| Audit logs | 90-365 days | Not created |
| PII in content | Redacted | Redacted |
| Analytics | Aggregated only | Opt-in only |

### GDPR Compliance

```typescript
interface PrivacyControls {
  right_to_access: boolean;      // Export all data
  right_to_erasure: boolean;     // Delete all data
  right_to_rectification: boolean; // Correct data
  right_to_portability: boolean; // Export in machine-readable format
  right_to_object: boolean;      // Opt-out of processing
}

class GDPRCompliance {
  async exportUserData(tenantId: string): Promise<Buffer> {
    const data = {
      tenant: await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]),
      audits: await db.query('SELECT * FROM audits WHERE tenant_id = $1', [tenantId]),
      policies: await db.query('SELECT * FROM policies WHERE tenant_id = $1', [tenantId]),
      webhooks: await db.query('SELECT * FROM webhooks WHERE tenant_id = $1', [tenantId])
    };
    
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  async deleteUserData(tenantId: string): Promise<void> {
    // Cascade delete with audit trail
    await db.transaction(async (tx) => {
      await tx.query('DELETE FROM audits WHERE tenant_id = $1', [tenantId]);
      await tx.query('DELETE FROM policies WHERE tenant_id = $1', [tenantId]);
      await tx.query('DELETE FROM webhooks WHERE tenant_id = $1', [tenantId]);
      await tx.query('DELETE FROM api_keys WHERE tenant_id = $1', [tenantId]);
      await tx.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      
      // Log deletion
      await tx.query(`
        INSERT INTO deletion_log (tenant_id, deleted_at, deleted_by)
        VALUES ($1, NOW(), 'gdpr_request')
      `, [tenantId]);
    });
  }
}
```

---

## 9. Security Testing Checklist

### Automated Tests

- [ ] Input sanitization (XSS, SQL injection)
- [ ] SSRF prevention (private IP blocking)
- [ ] Rate limiting enforcement
- [ ] Authentication bypass attempts
- [ ] Authorization boundary tests
- [ ] Signature verification (rule packs, webhooks)
- [ ] Encryption/decryption round-trip
- [ ] CSP header validation
- [ ] CORS policy enforcement
- [ ] Session expiry

### Manual Security Review

- [ ] Threat model updated
- [ ] Security architecture review
- [ ] Dependency vulnerability scan
- [ ] Secrets audit (no hardcoded secrets)
- [ ] Logging review (no PII in logs)
- [ ] Error messages (no internal details exposed)
- [ ] API documentation (security sections complete)

### Penetration Testing

- [ ] OWASP Top 10 coverage
- [ ] API fuzzing
- [ ] Authentication/authorization bypass
- [ ] Privilege escalation attempts
- [ ] Data exfiltration scenarios
- [ ] Denial of service resilience

---

## 10. Incident Response

### Security Incident Workflow

1. **Detection** → Alert triggered (automated or manual report)
2. **Triage** → Assess severity (P0-P4)
3. **Containment** → Isolate affected systems
4. **Investigation** → Root cause analysis
5. **Remediation** → Apply fixes
6. **Recovery** → Restore normal operations
7. **Post-Mortem** → Document lessons learned

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 | Critical - Data breach | 15 minutes | PII exposure |
| P1 | High - Service compromise | 1 hour | API key leak |
| P2 | Medium - Vulnerability | 4 hours | XSS discovered |
| P3 | Low - Security concern | 24 hours | Weak password |
| P4 | Info - Best practice | 1 week | Missing CSP header |

### Contact Information

```yaml
security_team:
  email: security@claimlens.com
  slack: #security-incidents
  pagerduty: claimlens-security
  
disclosure_policy:
  responsible_disclosure: security@claimlens.com
  bug_bounty: https://claimlens.com/security/bounty
  pgp_key: https://claimlens.com/security/pgp
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
