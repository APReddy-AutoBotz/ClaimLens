# Non-Functional Requirements — ClaimLens

## 1. Performance

**SLO:** API routes SHALL respond within 150ms at p95
**Test Method:** Load testing with 100 concurrent requests
**Measurement:** Prometheus metrics with 1-minute windows

**Specific Targets:**
- `/analyze` route: ≤ 150ms p95
- `/validate` route: ≤ 100ms p95  
- Transform pipeline: ≤ 50ms per item
- Browser extension overlay: ≤ 200ms initial load

## 2. Availability

**SLO:** 99.5% uptime during business hours (6 AM - 11 PM IST)
**Test Method:** Synthetic monitoring with 30-second intervals
**Measurement:** Uptime monitoring with alerting

**Dependencies:**
- Graceful degradation when MCP services unavailable
- Circuit breakers for external API calls
- Local fallbacks for critical transforms

## 3. Privacy

**Requirements:**
- No PII storage beyond request logs (24-hour retention)
- Request logs SHALL contain only decision metadata
- Browser extension SHALL NOT transmit user data
- All data processing SHALL occur locally or in-transit

**Test Method:** Privacy audit of log outputs and network traffic

## 4. Accessibility (WCAG AA)

**Requirements:**
- Color contrast ratio ≥ 4.5:1 for all text
- Keyboard navigation for all interactive elements
- Screen reader compatibility for warnings and badges
- ESC key SHALL close all tooltips and drawers
- Focus indicators visible on all focusable elements

**Test Method:** Automated accessibility scanning + manual keyboard testing

## 5. Internationalization

**Phase 1:** English (India) - en-IN
**Phase 2:** Hindi, Tamil, Bengali
**Requirements:**
- Unicode support for all text processing
- Locale-aware number formatting
- Right-to-left text support preparation
- Currency and unit localization

**Test Method:** Locale switching validation with sample content

## 6. Observability

**Log Format (JSON):**
```json
{
  "ts": "2024-11-01T10:30:00Z",
  "profile": "menushield_in",
  "route": "/analyze",
  "transform": "rewrite.disclaimer",
  "decision": "flagged",
  "reason": "contains banned claim: superfood",
  "duration_ms": 45
}
```

**Metrics:**
- Request latency histograms per route
- Transform success/failure rates
- Error rates by category
- Resource utilization (CPU, memory)

**Test Method:** Log parsing validation and metrics dashboard review

## 7. Security

**Requirements:**
- Input normalization using Unicode NFC
- HTML sanitization (CSP-friendly, no inline scripts)
- SSRF defense on MCP service calls
- Rate limiting: 100 requests/minute per API key + 10 req/s burst per IP
- HTTPS-only communication
- No code execution in transform pipeline
- SHA-256 signed rule packs with mandatory verification
- AES-256 encryption for PII at rest

**Test Method:** Security scanning (SAST), penetration testing, signature verification in CI

## 8. Multi-Tenancy

**Requirements:**
- Complete tenant data isolation (data, logs, audits, configs)
- Role-based access control (Admin, Editor, Viewer)
- Multi-factor authentication for Admin role
- 8-hour session expiry
- Exportable audit trail per tenant

**Test Method:** Cross-tenant access testing, permission matrix validation

## 9. Error Budgets and SLOs

**SLO Targets:**
- Availability: 99.5% during business hours (6 AM - 11 PM IST)
- Latency p95: /menu/feed ≤150ms, /menu/validate ≤100ms, /web/ingest ≤120ms, /web/overlay ≤80ms

**Error Budget:**
- 0.5% failed requests per 30-day window
- Alert thresholds: 50% consumed (warning), 80% consumed (critical)
- Automatic rollback on 5% error rate during staged rollout

**Test Method:** Load testing, error injection, rollback simulation

## 8. Scalability

**Current Target:** 1000 requests/hour
**Growth Plan:** Horizontal scaling with load balancer
**Bottlenecks:** Transform pipeline CPU usage
**Test Method:** Load testing with gradual ramp-up