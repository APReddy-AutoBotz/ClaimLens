# Observability — ClaimLens

## Overview

ClaimLens implements comprehensive observability with OpenTelemetry, structured logging, Prometheus metrics, and error budget tracking.

---

## 1. OpenTelemetry Integration

### Trace Configuration

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'claimlens-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics']
      }
    })
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### Custom Spans

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('claimlens-transforms');

async function executeTransform(
  item: MenuItem,
  transform: TransformFunction,
  context: TransformContext
): Promise<TransformResult> {
  const span = tracer.startSpan('transform.execute', {
    attributes: {
      'transform.name': transform.name,
      'transform.version': transform.version,
      'item.id': item.id,
      'tenant.id': context.tenant,
      'correlation.id': context.correlationId
    }
  });
  
  try {
    const result = await transform(item, context);
    
    span.setAttributes({
      'transform.modified': result.modified,
      'transform.flags_count': result.flags.length,
      'transform.duration_ms': span.duration
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Distributed Tracing

```typescript
import { propagation, context } from '@opentelemetry/api';

// Propagate trace context to MCP services
async function callMCPService(
  serviceName: string,
  payload: any
): Promise<any> {
  const headers: Record<string, string> = {};
  
  // Inject trace context into headers
  propagation.inject(context.active(), headers);
  
  const response = await fetch(`http://mcp-services/${serviceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}
```

---

## 2. Structured Logging

### Log Format

```typescript
interface LogEntry {
  ts: string;              // ISO 8601 timestamp
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  tenant?: string;
  request_id: string;      // Correlation ID
  profile?: string;
  route?: string;
  transform?: string;
  decision?: 'pass' | 'modify' | 'flag' | 'block';
  reason?: string;
  duration_ms?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
```

### Logger Implementation

```typescript
class StructuredLogger {
  private serviceName: string;
  private environment: string;
  private samplingRate: number = 1.0;
  
  constructor(serviceName: string, environment: string) {
    this.serviceName = serviceName;
    this.environment = environment;
  }
  
  log(entry: Partial<LogEntry>): void {
    // Sample at high QPS
    if (!this.shouldLog()) {
      return;
    }
    
    const fullEntry: LogEntry = {
      ts: new Date().toISOString(),
      level: entry.level || 'info',
      request_id: entry.request_id || this.generateRequestId(),
      ...entry
    };
    
    // Add service context
    fullEntry.metadata = {
      ...fullEntry.metadata,
      service: this.serviceName,
      environment: this.environment,
      hostname: os.hostname(),
      pid: process.pid
    };
    
    // Redact PII
    this.redactPII(fullEntry);
    
    // Output as JSON
    console.log(JSON.stringify(fullEntry));
  }
  
  private shouldLog(): boolean {
    const qps = this.getCurrentQPS();
    
    // Enable sampling at high QPS
    if (qps > 1000) {
      this.samplingRate = 0.1; // 10% sampling
    } else {
      this.samplingRate = 1.0; // 100% logging
    }
    
    return Math.random() < this.samplingRate;
  }
  
  private redactPII(entry: LogEntry): void {
    if (entry.metadata) {
      // Redact email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const metadataStr = JSON.stringify(entry.metadata);
      const redacted = metadataStr.replace(emailRegex, '[EMAIL_REDACTED]');
      entry.metadata = JSON.parse(redacted);
    }
  }
  
  private generateRequestId(): string {
    return crypto.randomUUID();
  }
  
  private getCurrentQPS(): number {
    // Implementation: track requests per second
    return 0; // Placeholder
  }
  
  // Convenience methods
  debug(message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'debug', reason: message, metadata });
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'info', reason: message, metadata });
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'warn', reason: message, metadata });
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      level: 'error',
      reason: message,
      error: error ? {
        code: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    });
  }
}

// Global logger instance
export const logger = new StructuredLogger('claimlens-api', process.env.NODE_ENV || 'development');
```

### Usage Examples

```typescript
// Transform execution logging
logger.log({
  level: 'info',
  tenant: 'tenant-001',
  request_id: correlationId,
  profile: 'menushield_in',
  route: '/menu/feed',
  transform: 'rewrite.disclaimer',
  decision: 'modify',
  reason: 'Detected banned claim: superfood',
  duration_ms: 12.5
});

// Error logging
logger.error('Transform execution failed', error, {
  tenant: 'tenant-001',
  transform: 'detect.allergens',
  item_id: 'item-123'
});

// Performance logging
logger.log({
  level: 'info',
  route: '/menu/feed',
  duration_ms: 145,
  metadata: {
    items_processed: 25,
    transforms_executed: 125,
    flags_generated: 8
  }
});
```

---

## 3. Prometheus Metrics

### Metrics Definition

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Counters
export const requestsTotal = new Counter({
  name: 'claimlens_requests_total',
  help: 'Total number of requests',
  labelNames: ['tenant', 'route', 'status'],
  registers: [register]
});

export const requestsFailed = new Counter({
  name: 'claimlens_requests_failed',
  help: 'Total number of failed requests',
  labelNames: ['tenant', 'route', 'error_code'],
  registers: [register]
});

export const transformsExecuted = new Counter({
  name: 'claimlens_transforms_executed',
  help: 'Total number of transforms executed',
  labelNames: ['tenant', 'profile', 'transform', 'decision'],
  registers: [register]
});

// Histograms
export const requestDuration = new Histogram({
  name: 'claimlens_request_duration_ms',
  help: 'Request duration in milliseconds',
  labelNames: ['tenant', 'route'],
  buckets: [10, 25, 50, 100, 150, 200, 500, 1000, 2000, 5000],
  registers: [register]
});

export const transformDuration = new Histogram({
  name: 'claimlens_transform_duration_ms',
  help: 'Transform execution duration in milliseconds',
  labelNames: ['tenant', 'profile', 'transform'],
  buckets: [1, 5, 10, 25, 50, 100, 200],
  registers: [register]
});

// Gauges
export const activeRequests = new Gauge({
  name: 'claimlens_active_requests',
  help: 'Number of requests currently being processed',
  labelNames: ['route'],
  registers: [register]
});

export const degradedServices = new Gauge({
  name: 'claimlens_degraded_services',
  help: 'Number of MCP services in degraded state',
  registers: [register]
});

export const errorBudgetRemaining = new Gauge({
  name: 'claimlens_error_budget_remaining',
  help: 'Percentage of error budget remaining',
  labelNames: ['route'],
  registers: [register]
});
```

### Metrics Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const route = req.route?.path || req.path;
  const tenant = req.tenant?.id || 'unknown';
  
  // Track active requests
  activeRequests.inc({ route });
  
  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Record metrics
    requestsTotal.inc({ tenant, route, status: status.toString() });
    requestDuration.observe({ tenant, route }, duration);
    
    if (status >= 400) {
      requestsFailed.inc({
        tenant,
        route,
        error_code: res.locals.errorCode || 'UNKNOWN'
      });
    }
    
    // Decrement active requests
    activeRequests.dec({ route });
  });
  
  next();
}
```

### Metrics Endpoint

```typescript
import express from 'express';

const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## 4. Error Budget Tracking

### SLO Definition

```typescript
interface SLO {
  name: string;
  route: string;
  target: number;        // e.g., 0.995 for 99.5%
  window: number;        // seconds (e.g., 2592000 for 30 days)
  errorBudget: number;   // calculated: 1 - target
}

const SLOS: SLO[] = [
  {
    name: 'menu_feed_availability',
    route: '/menu/feed',
    target: 0.995,
    window: 2592000, // 30 days
    errorBudget: 0.005
  },
  {
    name: 'menu_feed_latency',
    route: '/menu/feed',
    target: 0.95, // 95% of requests under 150ms
    window: 2592000,
    errorBudget: 0.05
  },
  {
    name: 'menu_validate_availability',
    route: '/menu/validate',
    target: 0.995,
    window: 2592000,
    errorBudget: 0.005
  },
  {
    name: 'web_ingest_availability',
    route: '/web/ingest',
    target: 0.995,
    window: 2592000,
    errorBudget: 0.005
  }
];
```

### Error Budget Calculator

```typescript
class ErrorBudgetTracker {
  private redis: Redis;
  
  async calculateErrorBudget(slo: SLO): Promise<ErrorBudgetStatus> {
    const windowStart = Date.now() - (slo.window * 1000);
    
    // Query metrics from Prometheus
    const totalRequests = await this.queryPrometheus(`
      sum(increase(claimlens_requests_total{route="${slo.route}"}[${slo.window}s]))
    `);
    
    const failedRequests = await this.queryPrometheus(`
      sum(increase(claimlens_requests_failed{route="${slo.route}"}[${slo.window}s]))
    `);
    
    // Calculate success rate
    const successRate = (totalRequests - failedRequests) / totalRequests;
    
    // Calculate error budget consumed
    const allowedFailures = totalRequests * slo.errorBudget;
    const actualFailures = failedRequests;
    const budgetConsumed = actualFailures / allowedFailures;
    const budgetRemaining = 1 - budgetConsumed;
    
    // Update gauge
    errorBudgetRemaining.set({ route: slo.route }, budgetRemaining * 100);
    
    return {
      slo: slo.name,
      route: slo.route,
      target: slo.target,
      actual: successRate,
      totalRequests,
      failedRequests,
      allowedFailures,
      budgetRemaining,
      budgetConsumed,
      status: this.getStatus(budgetRemaining),
      alerts: this.getAlerts(budgetRemaining)
    };
  }
  
  private getStatus(budgetRemaining: number): 'healthy' | 'warning' | 'critical' | 'exhausted' {
    if (budgetRemaining <= 0) return 'exhausted';
    if (budgetRemaining < 0.2) return 'critical';
    if (budgetRemaining < 0.5) return 'warning';
    return 'healthy';
  }
  
  private getAlerts(budgetRemaining: number): string[] {
    const alerts: string[] = [];
    
    if (budgetRemaining < 0.5) {
      alerts.push('50% error budget consumed - Warning threshold reached');
    }
    
    if (budgetRemaining < 0.2) {
      alerts.push('80% error budget consumed - Critical threshold reached');
    }
    
    if (budgetRemaining <= 0) {
      alerts.push('Error budget exhausted - Immediate action required');
    }
    
    return alerts;
  }
  
  private async queryPrometheus(query: string): Promise<number> {
    const response = await fetch(
      `${process.env.PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return parseFloat(data.data.result[0]?.value[1] || '0');
  }
}
```

### Error Budget Dashboard

```typescript
// API endpoint for error budget status
app.get('/api/v1/slo/status', async (req, res) => {
  const tracker = new ErrorBudgetTracker();
  const statuses = await Promise.all(
    SLOS.map(slo => tracker.calculateErrorBudget(slo))
  );
  
  res.json({
    timestamp: new Date().toISOString(),
    slos: statuses,
    overall_status: statuses.every(s => s.status === 'healthy') ? 'healthy' : 'degraded'
  });
});
```

---

## 5. Alerting Rules

### Prometheus Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: claimlens_slo_alerts
    interval: 1m
    rules:
      # Error budget alerts
      - alert: ErrorBudgetWarning
        expr: claimlens_error_budget_remaining < 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Error budget 50% consumed for {{ $labels.route }}"
          description: "Route {{ $labels.route }} has consumed 50% of error budget. Current: {{ $value }}%"
      
      - alert: ErrorBudgetCritical
        expr: claimlens_error_budget_remaining < 20
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error budget 80% consumed for {{ $labels.route }}"
          description: "Route {{ $labels.route }} has consumed 80% of error budget. Current: {{ $value }}%"
      
      - alert: ErrorBudgetExhausted
        expr: claimlens_error_budget_remaining <= 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Error budget exhausted for {{ $labels.route }}"
          description: "Route {{ $labels.route }} has exhausted error budget. Immediate action required."
      
      # Latency alerts
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(claimlens_request_duration_ms_bucket[5m])) > 150
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p95 latency on {{ $labels.route }}"
          description: "Route {{ $labels.route }} p95 latency is {{ $value }}ms (threshold: 150ms)"
      
      # Degraded mode alerts
      - alert: DegradedMode
        expr: claimlens_degraded_services > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "System operating in degraded mode"
          description: "{{ $value }} MCP services are unavailable"
      
      # High error rate
      - alert: HighErrorRate
        expr: rate(claimlens_requests_failed[5m]) / rate(claimlens_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.route }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
```

### Alert Routing

```yaml
# alertmanager/config.yml
route:
  receiver: 'default'
  group_by: ['alertname', 'route']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<pagerduty_key>'
        description: '{{ .GroupLabels.alertname }}'
  
  - name: 'slack'
    slack_configs:
      - api_url: '<slack_webhook_url>'
        channel: '#claimlens-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## 6. Dashboards

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "ClaimLens - System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(claimlens_requests_total[5m])",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(claimlens_requests_failed[5m]) / rate(claimlens_requests_total[5m])",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "p95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(claimlens_request_duration_ms_bucket[5m]))",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Budget Remaining",
        "targets": [
          {
            "expr": "claimlens_error_budget_remaining",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "gauge",
        "thresholds": [
          { "value": 0, "color": "red" },
          { "value": 20, "color": "orange" },
          { "value": 50, "color": "yellow" },
          { "value": 80, "color": "green" }
        ]
      },
      {
        "title": "Active Requests",
        "targets": [
          {
            "expr": "claimlens_active_requests",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Degraded Services",
        "targets": [
          {
            "expr": "claimlens_degraded_services"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

---

## 7. Log Aggregation

### Loki Configuration

```yaml
# loki/config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 168h
```

### Promtail Configuration

```yaml
# promtail/config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: claimlens-api
    static_configs:
      - targets:
          - localhost
        labels:
          job: claimlens-api
          __path__: /var/log/claimlens/*.log
    
    pipeline_stages:
      - json:
          expressions:
            ts: ts
            level: level
            tenant: tenant
            request_id: request_id
            route: route
            transform: transform
            decision: decision
            duration_ms: duration_ms
      
      - labels:
          level:
          tenant:
          route:
          transform:
          decision:
      
      - timestamp:
          source: ts
          format: RFC3339
```

---

## 8. Tracing Queries

### Jaeger Query Examples

```bash
# Find slow requests
curl 'http://jaeger:16686/api/traces?service=claimlens-api&minDuration=150ms&limit=20'

# Find errors
curl 'http://jaeger:16686/api/traces?service=claimlens-api&tags={"error":"true"}&limit=20'

# Find specific transform
curl 'http://jaeger:16686/api/traces?service=claimlens-api&tags={"transform.name":"rewrite.disclaimer"}&limit=20'

# Find by correlation ID
curl 'http://jaeger:16686/api/traces?service=claimlens-api&tags={"correlation.id":"550e8400-e29b-41d4-a716-446655440000"}'
```

---

## 9. Observability Checklist

### Implementation Checklist

- [ ] OpenTelemetry SDK configured
- [ ] Distributed tracing enabled
- [ ] Structured logging implemented
- [ ] PII redaction in logs
- [ ] Prometheus metrics exposed
- [ ] Error budget tracking active
- [ ] Alert rules configured
- [ ] Grafana dashboards created
- [ ] Log aggregation (Loki) configured
- [ ] Trace backend (Jaeger) configured
- [ ] Correlation IDs propagated
- [ ] Sampling configured for high QPS

### Monitoring Checklist

- [ ] SLO targets defined
- [ ] Error budgets calculated
- [ ] Alert thresholds set
- [ ] On-call rotation configured
- [ ] Runbook documented
- [ ] Dashboard access granted
- [ ] Log retention configured
- [ ] Metrics retention configured
- [ ] Trace retention configured

---

## 10. References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [SLO/SLI Best Practices](https://sre.google/workbook/implementing-slos/)
