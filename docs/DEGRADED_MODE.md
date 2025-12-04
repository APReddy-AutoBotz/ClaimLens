# Degraded Mode — ClaimLens

## Overview

ClaimLens continues operating when non-critical MCP services are unavailable, using fallback strategies to maintain core functionality.

---

## 1. Service Classification Matrix

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
    circuit_breaker:
      failure_threshold: 5
      success_threshold: 2
      reset_timeout_ms: 30000
    
  unit.convert:
    critical: false
    action: pass_through
    fallback_behavior: "Use default per-100g assumptions for nutrition normalization"
    banner_text: "Unit conversion unavailable. Using standard per-100g format."
    audit_note: "Processed without unit conversion: unit.convert service unavailable, applied per-100g defaults"
    timeout_ms: 500
    max_retries: 2
    circuit_breaker:
      failure_threshold: 5
      success_threshold: 2
      reset_timeout_ms: 30000
    
  recall.lookup:
    critical: false
    action: modify
    fallback_behavior: "Add generic food safety disclaimer instead of specific recall information"
    fallback_disclaimer: "Please verify ingredient safety with current food safety databases before consumption."
    banner_text: "Recall database unavailable. Generic safety disclaimers applied."
    audit_note: "Processed without recall lookup: recall.lookup service unavailable, applied generic safety disclaimer"
    timeout_ms: 500
    max_retries: 2
    circuit_breaker:
      failure_threshold: 5
      success_threshold: 2
      reset_timeout_ms: 30000
    
  alt.suggester:
    critical: false
    action: pass_through
    fallback_behavior: "Flag banned claims without suggesting compliant alternatives"
    banner_text: "Alternative suggestions unavailable. Flags shown without recommendations."
    audit_note: "Processed without alternatives: alt.suggester service unavailable, flagged without suggestions"
    timeout_ms: 500
    max_retries: 2
    circuit_breaker:
      failure_threshold: 5
      success_threshold: 2
      reset_timeout_ms: 30000
```

---

## 2. Circuit Breaker Implementation

### States

```typescript
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, reject immediately
  HALF_OPEN = 'half_open' // Testing if service recovered
}
```

### Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening (default: 5)
  successThreshold: number;      // Successes to close from half-open (default: 2)
  timeout: number;               // Timeout in ms (default: 500)
  resetTimeout: number;          // Time before trying half-open (default: 30000)
  maxInflight: number;           // Max concurrent requests (default: 10)
}
```

### Implementation

```typescript
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private inflightRequests: number = 0;
  
  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.serviceName}: Entering HALF_OPEN state`);
      } else {
        throw new CircuitBreakerOpenError(this.serviceName);
      }
    }
    
    // Check max inflight
    if (this.inflightRequests >= this.config.maxInflight) {
      throw new MaxInflightExceededError(this.serviceName);
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
        reject(new TimeoutError(`Timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.info(`Circuit breaker ${this.serviceName}: Closed after successful probes`);
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.serviceName}: Reopened after failure in HALF_OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.error(`Circuit breaker ${this.serviceName}: Opened after ${this.failureCount} failures`);
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getMetrics(): CircuitBreakerMetrics {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      inflightRequests: this.inflightRequests,
      lastFailureTime: this.lastFailureTime
    };
  }
}
```

---

## 3. Degraded Mode Manager

```typescript
class DegradedModeManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private degradedModeMatrix: Map<string, DegradedModeConfig>;
  
  constructor() {
    this.loadDegradedModeMatrix();
  }
  
  private loadDegradedModeMatrix(): void {
    const matrix = yaml.load(
      fs.readFileSync('.kiro/specs/degraded-mode-matrix.yaml', 'utf8')
    );
    
    this.degradedModeMatrix = new Map(
      Object.entries(matrix.services).map(([name, config]) => [name, config])
    );
  }
  
  async callService<T>(
    serviceName: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const breaker = this.getOrCreateBreaker(serviceName);
    const config = this.degradedModeMatrix.get(serviceName);
    
    if (!config) {
      throw new Error(`Unknown service: ${serviceName}`);
    }
    
    try {
      return await breaker.execute(fn);
    } catch (error) {
      logger.warn(`MCP service ${serviceName} failed:`, error);
      
      // Apply fallback based on degraded mode config
      if (!config.critical) {
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
          failureThreshold: config?.circuit_breaker?.failure_threshold || 5,
          successThreshold: config?.circuit_breaker?.success_threshold || 2,
          resetTimeout: config?.circuit_breaker?.reset_timeout_ms || 30000,
          maxInflight: 10
        })
      );
    }
    return this.circuitBreakers.get(serviceName)!;
  }
  
  private applyFallback(serviceName: string, config: DegradedModeConfig): any {
    switch (config.action) {
      case 'pass_through':
        logger.info(`Applying pass_through fallback for ${serviceName}`);
        return null; // Skip this transform
        
      case 'modify':
        logger.info(`Applying modify fallback for ${serviceName}`);
        return {
          fallback: true,
          disclaimer: config.fallback_disclaimer || "Service unavailable."
        };
        
      case 'block':
        logger.error(`Service ${serviceName} is critical and unavailable`);
        throw new CriticalServiceUnavailableError(serviceName);
        
      default:
        return null;
    }
  }
  
  getDegradedServices(): string[] {
    return Array.from(this.circuitBreakers.entries())
      .filter(([_, breaker]) => breaker.getState() !== CircuitState.CLOSED)
      .map(([name, _]) => name);
  }
  
  getSystemStatus(): SystemStatus {
    const degradedServices = this.getDegradedServices();
    
    return {
      status: degradedServices.length === 0 ? 'healthy' : 'degraded',
      degradedServices,
      circuitBreakers: Array.from(this.circuitBreakers.values()).map(b => b.getMetrics())
    };
  }
}
```

---

## 4. UI Banner Component

### Admin Console Banner

```typescript
interface DegradedModeBannerProps {
  degradedServices: string[];
}

function DegradedModeBanner({ degradedServices }: DegradedModeBannerProps) {
  if (degradedServices.length === 0) {
    return null;
  }
  
  const matrix = loadDegradedModeMatrix();
  
  return (
    <div className="degraded-mode-banner" role="alert">
      <div className="degraded-mode-banner__icon">⚠️</div>
      <div className="degraded-mode-banner__content">
        <strong>System Operating in Degraded Mode</strong>
        <ul>
          {degradedServices.map(service => {
            const config = matrix.services[service];
            return (
              <li key={service}>
                {config.banner_text}
              </li>
            );
          })}
        </ul>
        <a href="/docs/degraded-mode-matrix.yaml" target="_blank">
          View degraded mode policies →
        </a>
      </div>
      <button
        className="degraded-mode-banner__close"
        aria-label="Dismiss banner"
        onClick={() => {/* dismiss */}}
      >
        ×
      </button>
    </div>
  );
}
```

### Styles

```css
.degraded-mode-banner {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.degraded-mode-banner__icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.degraded-mode-banner__content {
  flex: 1;
}

.degraded-mode-banner__content strong {
  display: block;
  color: var(--color-amber);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
}

.degraded-mode-banner__content ul {
  margin: var(--space-2) 0;
  padding-left: var(--space-4);
  color: rgba(248, 250, 252, 0.8);
}

.degraded-mode-banner__content a {
  color: var(--color-teal);
  text-decoration: none;
  font-size: var(--text-sm);
}

.degraded-mode-banner__content a:hover {
  text-decoration: underline;
}

.degraded-mode-banner__close {
  background: none;
  border: none;
  color: rgba(248, 250, 252, 0.6);
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.degraded-mode-banner__close:hover {
  color: var(--color-cloud);
}
```

---

## 5. Audit Note Generation

```typescript
function generateAuditNote(
  degradedServices: string[],
  matrix: DegradedModeMatrix
): string {
  if (degradedServices.length === 0) {
    return '';
  }
  
  const notes = degradedServices.map(service => {
    const config = matrix.services[service];
    return config.audit_note;
  });
  
  return `Processed in degraded mode:\n${notes.join('\n')}`;
}

// Usage in audit record
const auditRecord: AuditRecord = {
  audit_id: generateAuditId(),
  ts: new Date().toISOString(),
  tenant: tenantId,
  profile: 'menushield_in',
  route: '/menu/feed',
  item_id: item.id,
  transforms: transformExecutions,
  verdict,
  latency_ms: totalLatency,
  degraded_mode: degradedServices.length > 0,
  degraded_services: degradedServices,
  degraded_note: generateAuditNote(degradedServices, matrix)
};
```

---

## 6. Health Check Endpoints

```typescript
// MCP service health check
app.get('/health/mcp/:service', async (req, res) => {
  const { service } = req.params;
  const manager = new DegradedModeManager();
  
  try {
    await manager.callService(service, async () => {
      const response = await fetch(`${getMCPServiceUrl(service)}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    });
    
    res.status(200).json({
      service,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      service,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System-wide health check
app.get('/health', async (req, res) => {
  const manager = new DegradedModeManager();
  const systemStatus = manager.getSystemStatus();
  
  const statusCode = systemStatus.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    status: systemStatus.status,
    degraded_services: systemStatus.degradedServices,
    circuit_breakers: systemStatus.circuitBreakers,
    timestamp: new Date().toISOString()
  });
});
```

---

## 7. Monitoring & Alerts

### Prometheus Metrics

```typescript
import { Gauge } from 'prom-client';

const degradedServicesGauge = new Gauge({
  name: 'claimlens_degraded_services',
  help: 'Number of MCP services in degraded state'
});

const circuitBreakerStateGauge = new Gauge({
  name: 'claimlens_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['service']
});

// Update metrics
function updateDegradedModeMetrics(manager: DegradedModeManager): void {
  const status = manager.getSystemStatus();
  
  degradedServicesGauge.set(status.degradedServices.length);
  
  status.circuitBreakers.forEach(breaker => {
    const stateValue = {
      'closed': 0,
      'half_open': 1,
      'open': 2
    }[breaker.state];
    
    circuitBreakerStateGauge.set(
      { service: breaker.serviceName },
      stateValue
    );
  });
}
```

### Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: degraded_mode_alerts
    interval: 1m
    rules:
      - alert: DegradedMode
        expr: claimlens_degraded_services > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "System operating in degraded mode"
          description: "{{ $value }} MCP services are unavailable"
      
      - alert: CircuitBreakerOpen
        expr: claimlens_circuit_breaker_state == 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker open for {{ $labels.service }}"
          description: "Service {{ $labels.service }} circuit breaker is open"
      
      - alert: CriticalServiceDown
        expr: claimlens_circuit_breaker_state{service=~"critical.*"} == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Critical service {{ $labels.service }} is down"
          description: "Immediate action required"
```

---

## 8. Testing Degraded Mode

### Simulate Service Failure

```typescript
describe('Degraded Mode', () => {
  test('continues processing when OCR service is down', async () => {
    // Mock OCR service failure
    mockMCPService('ocr.label', { status: 503 });
    
    const result = await processMenuItem(testItem, 'menushield_in');
    
    expect(result.verdict).toBeDefined();
    expect(result.degraded_mode).toBe(true);
    expect(result.degraded_services).toContain('ocr.label');
    expect(result.degraded_note).toContain('text-only analysis');
  });
  
  test('applies fallback disclaimer when recall service is down', async () => {
    mockMCPService('recall.lookup', { status: 503 });
    
    const result = await processMenuItem(testItem, 'menushield_in');
    
    expect(result.changes).toContainEqual(
      expect.objectContaining({
        field: 'description',
        after: expect.stringContaining('verify ingredient safety')
      })
    );
  });
  
  test('circuit breaker opens after 5 failures', async () => {
    const manager = new DegradedModeManager();
    const breaker = manager['getOrCreateBreaker']('ocr.label');
    
    // Trigger 5 failures
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Service down')));
      } catch (error) {
        // Expected
      }
    }
    
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });
  
  test('circuit breaker transitions to half-open after reset timeout', async () => {
    const manager = new DegradedModeManager();
    const breaker = manager['getOrCreateBreaker']('ocr.label');
    
    // Open circuit
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Service down')));
      } catch (error) {}
    }
    
    expect(breaker.getState()).toBe(CircuitState.OPEN);
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 30100));
    
    // Next call should transition to half-open
    try {
      await breaker.execute(() => Promise.resolve('success'));
    } catch (error) {}
    
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
  });
});
```

---

## 9. Runbook: Degraded Mode Incident

### Detection

1. **Alert fires:** "System operating in degraded mode"
2. **Check dashboard:** Degraded mode banner visible
3. **Check metrics:** `claimlens_degraded_services > 0`

### Investigation

```bash
# Check system health
curl http://api.claimlens.com/health

# Check specific service
curl http://api.claimlens.com/health/mcp/ocr.label

# Check circuit breaker metrics
curl http://api.claimlens.com/metrics | grep circuit_breaker
```

### Resolution

1. **Identify root cause:**
   - Service down?
   - Network issue?
   - Resource exhaustion?

2. **Restart service:**
   ```bash
   docker restart mcp-ocr-label
   ```

3. **Verify recovery:**
   ```bash
   curl http://mcp-services:7001/health
   ```

4. **Monitor circuit breaker:**
   - Should transition to HALF_OPEN
   - Then to CLOSED after 2 successful requests

### Communication

```
Subject: [RESOLVED] ClaimLens Degraded Mode - OCR Service

Timeline:
- 10:30 AM: Alert fired - OCR service unavailable
- 10:32 AM: Investigation started
- 10:35 AM: Root cause identified - OOM error
- 10:40 AM: Service restarted with increased memory
- 10:45 AM: Circuit breaker closed, system healthy

Impact:
- Image analysis unavailable for 15 minutes
- Text-based validation continued normally
- No data loss or incorrect verdicts

Action Items:
- [ ] Increase OCR service memory allocation
- [ ] Add memory usage alerts
- [ ] Review OCR service logs for memory leaks
```

---

## 10. References

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Resilience4j Documentation](https://resilience4j.readme.io/docs/circuitbreaker)
- [Netflix Hystrix](https://github.com/Netflix/Hystrix/wiki)
- [Release It! (Michael Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/)
