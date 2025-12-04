# Design Document — ClaimLens System

## Overview

ClaimLens is a distributed food content validation system with three primary components:
- MenuShield API (B2B pre-publish gate)
- ClaimLens Go browser extension (B2C overlay)
- Admin Console (management interface)

The system uses a transform pipeline architecture with policy-driven content analysis, multi-tenant isolation, and graceful degradation.

### Design Principles

1. **Deterministic First**: Rules and regex before LLM integration
2. **Fail-Safe**: Graceful degradation when services unavailable
3. **Privacy-First**: PII redaction by default, encryption at rest
4. **Observable**: Structured logging, correlation IDs, SLO tracking
5. **Extensible**: Plugin-based transforms, MCP service integration
6. **Accessible**: WCAG AA compliance, keyboard navigation

## Architecture

### System Components

**API Gateway Layer**
- Authentication and authorization
- Rate limiting (100 req/min per key, 10 req/s per IP)
- Correlation ID generation and propagation
- Tenant resolution from API key
- Request/response logging

**MenuShield API (B2B)**
- POST /v1/menu/feed - Full menu analysis
- POST /v1/menu/validate - Quick single-item validation
- GET /v1/export/menu.ndjson - Export cleaned items
- Profile: menushield_in

**Admin Console API**
- Dashboard metrics and KPIs
- Profile and route editor
- Rule pack management with versioning
- Fixtures runner
- Audit viewer
- Webhook configuration

**ClaimLens Go Extension (B2C)**
- Content script for page scanning
- Background service for processing
- Side panel UI for detailed view
- POST /v1/web/ingest endpoint
- Profile: claimlens_go

## Components and Interfaces

### Transform Pipeline Engine

**Core Responsibilities:**
- Load and parse policies.yaml
- Register transforms from packages/transforms/
- Execute transforms in defined order
- Collect results and generate verdicts
- Handle errors and timeouts
- Support degraded mode operation

**Interface:**
```typescript
interface TransformPipeline {
  loadPolicy(profile: string): Policy;
  registerTransform(name: string, fn: TransformFunction): void;
  execute(item: MenuItem, profile: string): Promise<Verdict>;
  getMetrics(): PipelineMetrics;
}

interface TransformFunction {
  (input: string, context: TransformContext): TransformResult;
}

interface TransformContext {
  locale: string;
  tenant: string;
  correlationId: string;
  mcpServices: MCPServiceRegistry;
}

interface TransformResult {
  text: string;
  modified: boolean;
  flags: Flag[];
  metadata: Record<string, any>;
}
```

### Policy Loader

**Responsibilities:**
- Parse and validate policies.yaml
- Verify rule pack signatures (SHA-256)
- Load rule packs from packs/ directory
- Cache policies with TTL
- Support hot-reload for policy updates

**Versioning:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- Version stored in policy file header
- Change log maintained in policy metadata

### Transform Registry

**Responsibilities:**
- Discover transforms in packages/transforms/
- Validate transform signatures
- Maintain transform metadata (name, version, dependencies)
- Support dynamic loading/unloading

**Transform Metadata:**
```yaml
name: rewrite.disclaimer
version: 1.2.0
dependencies:
  - packs/banned.claims.in.yaml
  - packs/disclaimers.in.md
latency_budget_ms: 10
critical: true
```

## Data Models

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  ingredients?: string[]; // Normalized to array; accepts string or string[] on input
  nutrition?: {
    calories?: string | number;
    sugar_g?: number;
    sodium_mg?: number;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

// Normalization helper for backward compatibility
function normalizeIngredients(input: string | string[] | undefined): string[] {
  if (!input) return [];
  if (typeof input === 'string') {
    // Split by comma, semicolon, or newline
    return input.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  return input;
}

// Usage in transform pipeline
const normalizedItem = {
  ...item,
  ingredients: normalizeIngredients(item.ingredients)
};
```

**Test Note:** All transforms in the pipeline MUST operate on normalized `ingredients: string[]`. Input validation should accept both formats but normalize before processing.

### Verdict
```typescript
interface Verdict {
  verdict: 'allow' | 'modify' | 'block';
  changes: Change[];
  reasons: Reason[];
  audit_id: string;
  correlation_id: string;
}

interface Change {
  field: string;
  before: string;
  after: string;
}

interface Reason {
  transform: string;
  why: string;
  source?: string;
}
```

### AuditRecord
```typescript
interface AuditRecord {
  audit_id: string;
  ts: string; // ISO 8601
  tenant: string;
  profile: string;
  route: string;
  item_id: string;
  transforms: TransformExecution[];
  verdict: Verdict;
  latency_ms: number;
  degraded_mode: boolean;
  degraded_services?: string[];
}

interface TransformExecution {
  name: string;
  duration_ms: number;
  decision: 'pass' | 'modify' | 'flag';
  metadata?: Record<string, any>;
}
```

### Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  api_keys: ApiKey[];
  config: TenantConfig;
  created_at: string;
  updated_at: string;
}

interface TenantConfig {
  retention_days: number; // 90-365
  webhook_url?: string;
  webhook_secret?: string;
  allowed_locales: string[];
  custom_rule_packs?: string[];
}
```

## Error Handling

### Error Classification

**Client Errors (4xx):**
- 400 Bad Request: Schema validation failure
- 401 Unauthorized: Missing/invalid API key
- 403 Forbidden: Insufficient permissions
- 429 Too Many Requests: Rate limit exceeded

**Server Errors (5xx):**
- 500 Internal Server Error: Unexpected failure
- 503 Service Unavailable: System overloaded or maintenance

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: Record<string, any>; // Additional context
  };
  correlation_id: string;
  retry_after?: number; // Seconds (for 429)
}
```

### Transform Error Handling

**Strategies:**
1. **Timeout**: Transform exceeds latency budget → skip and log
2. **Exception**: Transform throws error → catch, log, continue pipeline
3. **Validation**: Transform returns invalid result → reject and log
4. **Degraded**: MCP service unavailable → use fallback logic

**Error Budget:**
- 0.5% failed requests per 30-day window
- Alert at 50% consumed (warning)
- Alert at 80% consumed (critical)
- Automatic rollback at 5% error rate during staged rollout

## Testing Strategy

### Unit Tests
- All transforms in packages/transforms/__tests__/
- Test coverage minimum 80%
- Test cases: pass-through, modification, edge cases
- Mock MCP services for isolation

### Integration Tests
- Transform chain execution
- Policy loading and validation
- Audit record generation
- Webhook delivery

### Fixture Tests
- Run transform pipeline against fixtures/menu/*.json
- Run overlay against fixtures/sites/*.html
- Validate expected flags and modifications
- Performance regression detection

### Performance Tests
- Measure p50/p95 latency per transform
- Validate against latency budgets
- Load testing at 1000 QPS
- Stress testing to find breaking point

### Security Tests
- Input sanitization validation
- SSRF attack prevention
- Rate limiting enforcement
- Signature verification
- Cross-tenant isolation

## Multi-Tenancy Design

### Tenant Isolation

**Database Level:**
- Tenant ID column on all tables
- Row-level security policies
- Separate schemas per tenant (optional for large tenants)

**Application Level:**
- Tenant context extracted from API key
- All queries filtered by tenant ID
- Cross-tenant access blocked at middleware layer

**Storage Level:**
- Tenant-prefixed object keys in S3
- Separate encryption keys per tenant
- Audit logs partitioned by tenant

### RBAC Implementation

**Roles:**
```typescript
enum Role {
  ADMIN = 'admin',     // Full access
  EDITOR = 'editor',   // Packs and policies only
  VIEWER = 'viewer'    // Read-only
}

interface Permission {
  resource: string;    // e.g., 'policies', 'rule_packs', 'audits'
  actions: string[];   // e.g., ['read', 'write', 'delete']
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    { resource: '*', actions: ['*'] }
  ],
  editor: [
    { resource: 'policies', actions: ['read', 'write'] },
    { resource: 'rule_packs', actions: ['read', 'write'] },
    { resource: 'audits', actions: ['read'] }
  ],
  viewer: [
    { resource: '*', actions: ['read'] }
  ]
};
```

**Permission Check:**
```typescript
function checkPermission(
  user: User,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions.some(p =>
    (p.resource === '*' || p.resource === resource) &&
    (p.actions.includes('*') || p.actions.includes(action))
  );
}
```

## Degraded Mode Implementation

### Service Classification Matrix

```yaml
services:
  ocr.label:
    critical: false
    action: pass_through
    fallback: "Skip OCR, use text-only analysis"
    
  unit.convert:
    critical: false
    action: pass_through
    fallback: "Use default per-100g assumptions"
    
  recall.lookup:
    critical: false
    action: modify
    fallback: "Add generic safety disclaimer"
    
  alt.suggester:
    critical: false
    action: pass_through
    fallback: "Flag without suggesting alternatives"
```

### Degraded Mode Detection

```typescript
interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
}

class DegradedModeManager {
  private healthChecks: Map<string, ServiceHealth>;
  
  async checkHealth(service: string): Promise<boolean> {
    try {
      const start = Date.now();
      await fetch(`${serviceUrl}/health`, { timeout: 500 });
      const duration = Date.now() - start;
      
      this.healthChecks.set(service, {
        name: service,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: duration
      });
      return true;
    } catch (error) {
      this.healthChecks.set(service, {
        name: service,
        status: 'down',
        lastCheck: new Date(),
        responseTime: -1
      });
      return false;
    }
  }
  
  getDegradedServices(): string[] {
    return Array.from(this.healthChecks.values())
      .filter(h => h.status !== 'healthy')
      .map(h => h.name);
  }
}
```

## Performance Optimization

### Caching Strategy

**Policy Cache:**
- TTL: 5 minutes
- Invalidation: On policy update
- Storage: Redis
- Key pattern: `policy:{profile}:{version}`

**Rule Pack Cache:**
- TTL: 15 minutes
- Invalidation: On pack update
- Storage: Redis
- Key pattern: `pack:{name}:{version}`

**Transform Results Cache:**
- TTL: 1 hour
- Key: SHA-256 hash of (item content + profile + locale)
- Storage: Redis
- Eviction: LRU

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_audits_tenant_ts ON audits(tenant_id, ts DESC);
CREATE INDEX idx_audits_correlation ON audits(correlation_id);
CREATE INDEX idx_audits_item ON audits(item_id);
CREATE INDEX idx_tenants_api_key ON api_keys(key_hash);
```

**Partitioning:**
- Audit records partitioned by month
- Automatic partition creation
- Old partition archival after retention period

### Query Optimization

**Pagination:**
- Cursor-based for large result sets
- Limit: 100 items per page (max 1000)
- Index-backed ordering

**Aggregations:**
- Pre-computed KPI metrics
- Materialized views for dashboard
- Refresh every 5 minutes

## Security Implementation

### Input Sanitization

```typescript
function sanitizeInput(text: string): string {
  // Unicode normalization
  let sanitized = text.normalize('NFC');
  
  // Remove control characters except newline/tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}
```

### HTML Sanitization (for overlays)

```typescript
function sanitizeHTML(html: string): string {
  // Remove script tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return html;
}
```

### SSRF Defense

```typescript
const ALLOWED_MCP_HOSTS = [
  'localhost',
  '127.0.0.1',
  'mcp.claimlens.internal'
];

function validateMCPUrl(url: string): boolean {
  const parsed = new URL(url);
  return ALLOWED_MCP_HOSTS.includes(parsed.hostname);
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private redis: Redis;
  
  async checkLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<boolean> {
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, window);
    }
    
    return count <= limit;
  }
  
  async checkBurst(ip: string): Promise<boolean> {
    return this.checkLimit(`burst:${ip}`, 10, 1); // 10 req/s
  }
  
  async checkApiKey(apiKey: string): Promise<boolean> {
    return this.checkLimit(`api:${apiKey}`, 100, 60); // 100 req/min
  }
}
```

## Observability Design

### Structured Logging

```typescript
interface LogEntry {
  ts: string;              // ISO 8601 timestamp
  level: 'debug' | 'info' | 'warn' | 'error';
  tenant?: string;
  request_id: string;      // Correlation ID
  profile?: string;
  route?: string;
  transform?: string;
  decision?: string;
  reason?: string;
  duration_ms?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  log(entry: Partial<LogEntry>): void {
    const fullEntry: LogEntry = {
      ts: new Date().toISOString(),
      level: entry.level || 'info',
      request_id: entry.request_id || generateId(),
      ...entry
    };
    
    // Redact PII
    if (fullEntry.metadata) {
      fullEntry.metadata = redactPII(fullEntry.metadata);
    }
    
    // Sample at high QPS
    if (this.shouldSample()) {
      console.log(JSON.stringify(fullEntry));
    }
  }
  
  private shouldSample(): boolean {
    const qps = this.getCurrentQPS();
    if (qps > 1000) {
      return Math.random() < 0.1; // 10% sampling
    }
    return true;
  }
}
```

### Metrics Collection

```typescript
interface Metrics {
  // Counters
  requests_total: Counter;
  requests_failed: Counter;
  transforms_executed: Counter;
  
  // Histograms
  request_duration_ms: Histogram;
  transform_duration_ms: Histogram;
  
  // Gauges
  active_requests: Gauge;
  degraded_services: Gauge;
}

// Prometheus-compatible metrics
const metrics = {
  requests_total: new Counter({
    name: 'claimlens_requests_total',
    help: 'Total number of requests',
    labelNames: ['tenant', 'route', 'status']
  }),
  
  request_duration_ms: new Histogram({
    name: 'claimlens_request_duration_ms',
    help: 'Request duration in milliseconds',
    labelNames: ['tenant', 'route'],
    buckets: [10, 25, 50, 100, 150, 200, 500, 1000]
  })
};
```

### SLO Tracking

```typescript
interface SLO {
  name: string;
  target: number;        // e.g., 0.995 for 99.5%
  window: number;        // seconds
  errorBudget: number;   // calculated from target
}

class SLOTracker {
  private slos: Map<string, SLO>;
  
  async checkSLO(name: string): Promise<SLOStatus> {
    const slo = this.slos.get(name);
    const window = slo.window;
    
    const total = await this.getRequestCount(name, window);
    const failed = await this.getFailedCount(name, window);
    
    const successRate = (total - failed) / total;
    const errorBudgetRemaining = 1 - (failed / (total * (1 - slo.target)));
    
    return {
      name,
      successRate,
      errorBudgetRemaining,
      status: successRate >= slo.target ? 'healthy' : 'violated'
    };
  }
}
```

## Deployment Architecture

### Container Structure

```yaml
services:
  api-gateway:
    image: claimlens/api-gateway:latest
    ports: ["8080:8080"]
    environment:
      - REDIS_URL
      - DATABASE_URL
    
  menushield-api:
    image: claimlens/menushield:latest
    replicas: 3
    environment:
      - REDIS_URL
      - DATABASE_URL
      - MCP_REGISTRY_URL
    
  admin-console:
    image: claimlens/admin-console:latest
    ports: ["3000:3000"]
    
  mcp-services:
    image: claimlens/mcp-services:latest
    ports: ["7001-7004:7001-7004"]
    
  postgres:
    image: timescale/timescaledb:latest
    volumes: ["pgdata:/var/lib/postgresql/data"]
    
  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]
```

### Health Checks

```typescript
// API health endpoint
app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMCPServices()
  ]);
  
  const healthy = checks.every(c => c.status === 'ok');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  
  // Stop accepting new requests
  server.close();
  
  // Wait for in-flight requests (max 30s)
  await waitForRequests(30000);
  
  // Close database connections
  await db.close();
  
  // Close Redis connections
  await redis.quit();
  
  console.log('Graceful shutdown complete');
  process.exit(0);
});
```

## Design Decisions and Rationales

### 1. Transform Pipeline vs Monolithic Processor
**Decision:** Plugin-based transform pipeline
**Rationale:** Extensibility, testability, independent deployment of transforms

### 2. Redis for Caching
**Decision:** Redis with TTL-based invalidation
**Rationale:** Fast, proven, supports complex data structures, pub/sub for cache invalidation

### 3. TimescaleDB for Audits
**Decision:** TimescaleDB (PostgreSQL extension) for time-series audit data
**Rationale:** SQL compatibility, automatic partitioning, compression, retention policies

### 4. Correlation IDs
**Decision:** Required X-Correlation-ID header on all requests
**Rationale:** Distributed tracing, debugging, audit trail linking

### 5. Staged Rollout
**Decision:** 10% → 50% → 100% with automatic rollback
**Rationale:** Risk mitigation, gradual validation, quick recovery

### 6. Browser Extension MV3
**Decision:** Manifest V3 for Chrome extension
**Rationale:** Future-proof, better security, service worker architecture

### 7. Degraded Mode
**Decision:** Continue processing with fallbacks vs failing fast
**Rationale:** Availability over consistency for non-critical features

### 8. Multi-Tenancy
**Decision:** Shared database with tenant ID filtering
**Rationale:** Cost-effective, simpler operations, adequate isolation for most use cases


## Idempotency Implementation

### Idempotency Key Handling

```typescript
interface IdempotencyRecord {
  key: string;
  response: any;
  created_at: Date;
  ttl: number; // 24 hours
}

class IdempotencyManager {
  private redis: Redis;
  private TTL = 24 * 60 * 60; // 24 hours in seconds
  
  async checkIdempotency(key: string): Promise<any | null> {
    const cached = await this.redis.get(`idempotency:${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }
  
  async storeResponse(key: string, response: any): Promise<void> {
    await this.redis.setex(
      `idempotency:${key}`,
      this.TTL,
      JSON.stringify(response)
    );
  }
  
  async handleRequest(
    key: string | undefined,
    handler: () => Promise<any>
  ): Promise<any> {
    if (!key) {
      // No idempotency key, process normally
      return await handler();
    }
    
    // Check for existing response
    const cached = await this.checkIdempotency(key);
    if (cached) {
      return cached;
    }
    
    // Process request
    const response = await handler();
    
    // Store for future requests
    await this.storeResponse(key, response);
    
    return response;
  }
}
```

### Pagination Implementation

```typescript
interface PaginationCursor {
  last_id: string;
  last_ts: string;
}

interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  total_count: number;
}

class PaginationManager {
  encodeCursor(cursor: PaginationCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }
  
  decodeCursor(encoded: string): PaginationCursor {
    return JSON.parse(Buffer.from(encoded, 'base64').toString());
  }
  
  async paginateAudits(
    tenant: string,
    cursor?: string,
    limit: number = 100
  ): Promise<PaginatedResponse<AuditRecord>> {
    // Enforce limit caps
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    
    let query = db.query('audits')
      .where('tenant_id', tenant)
      .orderBy('ts', 'desc')
      .limit(safeLimit + 1); // Fetch one extra to check if more exist
    
    if (cursor) {
      const decoded = this.decodeCursor(cursor);
      query = query
        .where('ts', '<', decoded.last_ts)
        .orWhere(function() {
          this.where('ts', '=', decoded.last_ts)
            .where('id', '<', decoded.last_id);
        });
    }
    
    const results = await query;
    const hasMore = results.length > safeLimit;
    const data = hasMore ? results.slice(0, -1) : results;
    
    let next_cursor: string | undefined;
    if (hasMore) {
      const last = data[data.length - 1];
      next_cursor = this.encodeCursor({
        last_id: last.id,
        last_ts: last.ts
      });
    }
    
    const total_count = await db.query('audits')
      .where('tenant_id', tenant)
      .count();
    
    return {
      data,
      next_cursor,
      total_count
    };
  }
}
```


## Augment-Lite Governance UI

### Modal Interface for Risky Policy Edits

```typescript
interface AugmentLiteModal {
  trigger: 'transform_reorder' | 'threshold_change' | 'rule_pack_edit';
  riskLevel: 'low' | 'medium' | 'high';
  fields: {
    context: string;        // What are you changing and why?
    constraints: string;    // What constraints must be maintained?
    selfCritique: string;   // What could go wrong?
    confirm: boolean;       // I understand the risks
  };
  autonomySlider: number;   // 0-5, capped by risk profile
}

interface RiskProfile {
  action: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxAutonomy: number;      // Maximum slider value allowed
  requiresApproval: boolean;
}

const RISK_PROFILES: Record<string, RiskProfile> = {
  'reorder_transforms': {
    action: 'Reorder transforms in pipeline',
    riskLevel: 'high',
    maxAutonomy: 2,
    requiresApproval: true
  },
  'change_threshold': {
    action: 'Modify nutrition thresholds',
    riskLevel: 'medium',
    maxAutonomy: 3,
    requiresApproval: false
  },
  'edit_rule_pack': {
    action: 'Edit rule pack content',
    riskLevel: 'medium',
    maxAutonomy: 3,
    requiresApproval: false
  },
  'add_transform': {
    action: 'Add new transform to pipeline',
    riskLevel: 'high',
    maxAutonomy: 2,
    requiresApproval: true
  }
};

class AugmentLiteGate {
  async validateEdit(
    action: string,
    fields: AugmentLiteModal['fields'],
    autonomy: number
  ): Promise<ValidationResult> {
    const profile = RISK_PROFILES[action];
    
    // Validate required fields
    if (!fields.context || fields.context.length < 20) {
      return { valid: false, error: 'Context must be at least 20 characters' };
    }
    
    if (!fields.constraints || fields.constraints.length < 20) {
      return { valid: false, error: 'Constraints must be at least 20 characters' };
    }
    
    if (!fields.selfCritique || fields.selfCritique.length < 20) {
      return { valid: false, error: 'Self-critique must be at least 20 characters' };
    }
    
    if (!fields.confirm) {
      return { valid: false, error: 'You must confirm understanding of risks' };
    }
    
    // Validate autonomy slider
    if (autonomy > profile.maxAutonomy) {
      return {
        valid: false,
        error: `Autonomy level ${autonomy} exceeds maximum ${profile.maxAutonomy} for ${profile.riskLevel} risk actions`
      };
    }
    
    return { valid: true };
  }
  
  async logPolicyChange(
    user: User,
    action: string,
    before: any,
    after: any,
    augmentLiteFields: AugmentLiteModal['fields']
  ): Promise<void> {
    const changeLog = {
      ts: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      action,
      before: JSON.stringify(before),
      after: JSON.stringify(after),
      diff: generateDiff(before, after),
      context: augmentLiteFields.context,
      constraints: augmentLiteFields.constraints,
      self_critique: augmentLiteFields.selfCritique,
      version: incrementVersion(before.version)
    };
    
    await db.insert('policy_change_log', changeLog);
  }
}
```

### UI Flow

1. User attempts risky edit (e.g., reorder transforms)
2. System detects risk level and shows Augment-Lite modal
3. User fills 4C fields:
   - **Context**: "Moving redact.pii before rewrite.disclaimer to ensure PII is removed before adding disclaimers"
   - **Constraints**: "Must maintain all existing transforms, only changing order. Latency budget must not increase."
   - **Self-Critique**: "Risk: PII might appear in disclaimer text if order is wrong. Mitigation: Test with fixtures containing PII."
   - **Confirm**: ✓ checkbox
4. User adjusts autonomy slider (capped at 2 for high-risk)
5. System validates all fields (minimum 20 chars each)
6. If high-risk + requires approval: Route to Admin for review
7. If approved: Apply change, version policy, log to audit trail
8. Show diff view before final save

### Acceptance Criteria Integration

**Requirement 7 (Admin Console - Profile Editor) - Updated AC:**
4. WHEN a user attempts a high-risk policy edit (changing transform order or critical thresholds), THE Admin Console SHALL display an Augment-Lite modal requiring four fields (Context, Constraints, Self-Critique, Confirm) with minimum 20 characters each
5. WHEN a user sets autonomy slider above risk-profile maximum, THE Admin Console SHALL reject the value and display the maximum allowed for that risk level
6. WHEN a user saves profile changes, THE Admin Console SHALL version the policy (semantic versioning), log user/time/diff to audit trail, and write updated configuration to .kiro/specs/policies.yaml


## Browser Extension Performance Strategy

### Progressive Scanning Architecture

```typescript
class ContentScanner {
  private observer: MutationObserver;
  private processedItems: Set<string> = new Set();
  private scanQueue: HTMLElement[] = [];
  private isProcessing: boolean = false;
  
  async initialize(): Promise<void> {
    // First-viewport scan (≤200ms for ≤20 items)
    await this.scanViewport();
    
    // Set up incremental scanning for rest of page
    this.setupMutationObserver();
    this.scheduleIncrementalScan();
  }
  
  async scanViewport(): Promise<void> {
    const start = performance.now();
    const viewportItems = this.getViewportItems();
    
    // Limit to 20 items for first scan
    const itemsToProcess = viewportItems.slice(0, 20);
    
    await this.processBatch(itemsToProcess);
    
    const duration = performance.now() - start;
    console.log(`Viewport scan completed in ${duration}ms`);
    
    // Queue remaining items for incremental processing
    if (viewportItems.length > 20) {
      this.scanQueue.push(...viewportItems.slice(20));
    }
  }
  
  setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      // Throttle: collect mutations and process in batches
      const newItems = this.extractNewItems(mutations);
      this.scanQueue.push(...newItems);
      this.scheduleIncrementalScan();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  scheduleIncrementalScan(): void {
    if (this.isProcessing || this.scanQueue.length === 0) {
      return;
    }
    
    // Use requestIdleCallback for non-critical processing
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        this.processIncrementally(deadline);
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => this.processIncrementally(), 100);
    }
  }
  
  async processIncrementally(deadline?: IdleDeadline): Promise<void> {
    this.isProcessing = true;
    const batchSize = 5; // Process 5 items at a time
    
    while (this.scanQueue.length > 0) {
      // Check if we have time remaining (or no deadline in fallback)
      if (deadline && deadline.timeRemaining() < 10) {
        break; // Yield to browser
      }
      
      const batch = this.scanQueue.splice(0, batchSize);
      const start = performance.now();
      
      await this.processBatch(batch);
      
      const duration = performance.now() - start;
      
      // Ensure we don't block main thread >50ms
      if (duration > 50) {
        console.warn(`Batch processing took ${duration}ms, yielding`);
        break;
      }
    }
    
    this.isProcessing = false;
    
    // Schedule next batch if queue not empty
    if (this.scanQueue.length > 0) {
      this.scheduleIncrementalScan();
    }
  }
  
  async processBatch(items: HTMLElement[]): Promise<void> {
    // Extract item data
    const menuItems = items.map(el => this.extractItemData(el));
    
    // Call API
    const response = await fetch('/v1/web/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Correlation-ID': crypto.randomUUID()
      },
      body: JSON.stringify({ items: menuItems })
    });
    
    const { badges } = await response.json();
    
    // Apply badges (must be fast, <10ms per item)
    badges.forEach(badge => {
      const element = items.find(el => el.dataset.itemId === badge.item_id);
      if (element) {
        this.applyBadge(element, badge);
        this.processedItems.add(badge.item_id);
      }
    });
  }
  
  applyBadge(element: HTMLElement, badge: Badge): void {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'claimlens-badge';
    badgeEl.dataset.kind = badge.kind;
    badgeEl.textContent = badge.label;
    badgeEl.setAttribute('role', 'status');
    badgeEl.setAttribute('aria-label', badge.explanation);
    
    // Inject without breaking layout
    element.style.position = 'relative';
    badgeEl.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    
    element.appendChild(badgeEl);
  }
  
  // Infinite scroll support
  handleScroll = throttle(() => {
    const newViewportItems = this.getViewportItems();
    const unprocessed = newViewportItems.filter(
      el => !this.processedItems.has(el.dataset.itemId!)
    );
    
    if (unprocessed.length > 0) {
      this.scanQueue.push(...unprocessed);
      this.scheduleIncrementalScan();
    }
  }, 500); // Throttle scroll events
}

function throttle(fn: Function, delay: number) {
  let lastCall = 0;
  return function(...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
```

### Playwright E2E Test Plan

```typescript
// tests/e2e/overlay.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ClaimLens Go Overlay', () => {
  test('should scan viewport within 200ms', async ({ page }) => {
    await page.goto('http://localhost:3000/fixtures/sites/sample.html');
    
    const start = Date.now();
    await page.waitForSelector('.claimlens-badge', { timeout: 5000 });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
    
    // Verify badges appeared
    const badges = await page.locator('.claimlens-badge').count();
    expect(badges).toBeGreaterThan(0);
  });
  
  test('should not block main thread >50ms', async ({ page }) => {
    await page.goto('http://localhost:3000/fixtures/sites/large-menu.html');
    
    // Measure long tasks
    const longTasks = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const long = entries.filter(e => e.duration > 50);
          resolve(long.length);
        });
        observer.observe({ entryTypes: ['longtask'] });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    expect(longTasks).toBe(0);
  });
  
  test('should support infinite scroll', async ({ page }) => {
    await page.goto('http://localhost:3000/fixtures/sites/infinite-scroll.html');
    
    // Initial badges
    const initialCount = await page.locator('.claimlens-badge').count();
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    
    // New badges should appear
    const afterScrollCount = await page.locator('.claimlens-badge').count();
    expect(afterScrollCount).toBeGreaterThan(initialCount);
  });
  
  test('should meet WCAG AA accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/fixtures/sites/sample.html');
    await page.waitForSelector('.claimlens-badge');
    
    // Check contrast ratio
    const badge = page.locator('.claimlens-badge').first();
    const contrast = await page.evaluate((el) => {
      // Calculate contrast ratio
      const bg = window.getComputedStyle(el).backgroundColor;
      const fg = window.getComputedStyle(el).color;
      return calculateContrastRatio(bg, fg);
    }, await badge.elementHandle());
    
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    
    // Check ARIA labels
    const ariaLabel = await badge.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className);
    expect(focused).toContain('claimlens-badge');
  });
});
```


## Enhanced Degraded Mode with Circuit Breakers

### Degraded Mode Matrix (Concrete Specifications)

```yaml
# .kiro/specs/degraded-mode-matrix.yaml
services:
  ocr.label:
    critical: false
    action: pass_through
    fallback_behavior: "Skip OCR processing, use text-only analysis"
    banner_text: "Image analysis unavailable. Text-based validation active."
    audit_note: "Processed without OCR: ocr.label service unavailable, applied text-only analysis"
    timeout_ms: 500
    max_retries: 2
    
  unit.convert:
    critical: false
    action: pass_through
    fallback_behavior: "Use default per-100g assumptions for nutrition normalization"
    banner_text: "Unit conversion unavailable. Using standard per-100g format."
    audit_note: "Processed without unit conversion: unit.convert service unavailable, applied per-100g defaults"
    timeout_ms: 500
    max_retries: 2
    
  recall.lookup:
    critical: false
    action: modify
    fallback_behavior: "Add generic food safety disclaimer instead of specific recall information"
    banner_text: "Recall database unavailable. Generic safety disclaimers applied."
    audit_note: "Processed without recall lookup: recall.lookup service unavailable, applied generic safety disclaimer"
    timeout_ms: 500
    max_retries: 2
    fallback_disclaimer: "Please verify ingredient safety with current food safety databases."
    
  alt.suggester:
    critical: false
    action: pass_through
    fallback_behavior: "Flag banned claims without suggesting compliant alternatives"
    banner_text: "Alternative suggestions unavailable. Flags shown without recommendations."
    audit_note: "Processed without alternatives: alt.suggester service unavailable, flagged without suggestions"
    timeout_ms: 500
    max_retries: 2
```

### Circuit Breaker Implementation

```typescript
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, reject immediately
  HALF_OPEN = 'half_open' // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening (default: 5)
  successThreshold: number;      // Successes to close from half-open (default: 2)
  timeout: number;               // Timeout in ms (default: 500)
  resetTimeout: number;          // Time before trying half-open (default: 30000)
  maxInflight: number;           // Max concurrent requests (default: 10)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private inflightRequests: number = 0;
  private config: CircuitBreakerConfig;
  
  constructor(
    private serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 500,
      resetTimeout: 30000,
      maxInflight: 10,
      ...config
    };
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`Circuit breaker ${this.serviceName}: Entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${this.serviceName} is OPEN`);
      }
    }
    
    // Check max inflight
    if (this.inflightRequests >= this.config.maxInflight) {
      throw new Error(`Circuit breaker ${this.serviceName}: Max inflight requests exceeded`);
    }
    
    this.inflightRequests++;
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        this.timeoutPromise()
      ]);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      this.inflightRequests--;
    }
  }
  
  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`Circuit breaker ${this.serviceName}: Closed after successful probes`);
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker ${this.serviceName}: Reopened after failure in HALF_OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker ${this.serviceName}: Opened after ${this.failureCount} failures`);
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// MCP Service Manager with Circuit Breakers
class MCPServiceManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private degradedModeMatrix: Map<string, DegradedModeConfig>;
  
  async callService<T>(
    serviceName: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const breaker = this.getOrCreateBreaker(serviceName);
    const config = this.degradedModeMatrix.get(serviceName);
    
    try {
      return await breaker.execute(fn);
    } catch (error) {
      console.warn(`MCP service ${serviceName} failed:`, error);
      
      // Apply fallback based on degraded mode config
      if (config && !config.critical) {
        return this.applyFallback(serviceName, config);
      }
      
      throw error; // Critical service, propagate error
    }
  }
  
  private getOrCreateBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const config = this.degradedModeMatrix.get(serviceName);
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker(serviceName, {
          timeout: config?.timeout_ms || 500,
          failureThreshold: config?.max_retries || 5
        })
      );
    }
    return this.circuitBreakers.get(serviceName)!;
  }
  
  private applyFallback(serviceName: string, config: DegradedModeConfig): any {
    switch (config.action) {
      case 'pass_through':
        return null; // Skip this transform
      case 'modify':
        return { fallback: true, disclaimer: config.fallback_disclaimer };
      default:
        return null;
    }
  }
  
  getDegradedServices(): string[] {
    return Array.from(this.circuitBreakers.entries())
      .filter(([_, breaker]) => breaker.getState() !== CircuitState.CLOSED)
      .map(([name, _]) => name);
  }
}
```

### UI Degraded Mode Banner

```typescript
// Admin Console degraded mode banner component
interface DegradedModeBanner {
  services: string[];
  bannerText: string;
  auditNoteLink: string;
}

function renderDegradedBanner(degradedServices: string[]): string {
  if (degradedServices.length === 0) return '';
  
  const serviceTexts = degradedServices.map(service => {
    const config = degradedModeMatrix.get(service);
    return config?.banner_text || `${service} unavailable`;
  });
  
  return `
    <div class="degraded-mode-banner" role="alert">
      <span class="icon">⚠️</span>
      <div class="content">
        <strong>System Operating in Degraded Mode</strong>
        <ul>
          ${serviceTexts.map(text => `<li>${text}</li>`).join('')}
        </ul>
        <a href="/docs/degraded-mode-matrix.yaml">View degraded mode policies</a>
      </div>
    </div>
  `;
}
```
