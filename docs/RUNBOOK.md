# Runbook — ClaimLens Operations

## Overview

This runbook provides procedures for common operational tasks, incident response, and system maintenance.

---

## 1. System Health Checks

### Daily Health Check

```bash
# Check API health
curl https://api.claimlens.com/health

# Check MCP services
curl https://api.claimlens.com/health/mcp/ocr.label
curl https://api.claimlens.com/health/mcp/unit.convert
curl https://api.claimlens.com/health/mcp/recall.lookup
curl https://api.claimlens.com/health/mcp/alt.suggester

# Check metrics
curl https://api.claimlens.com/metrics | grep claimlens_requests_total

# Check error budget
curl https://api.claimlens.com/api/v1/slo/status
```

### Expected Responses

```json
// Healthy system
{
  "status": "healthy",
  "checks": [
    { "name": "database", "status": "ok" },
    { "name": "redis", "status": "ok" },
    { "name": "mcp_services", "status": "ok" }
  ],
  "timestamp": "2025-11-02T10:30:00Z"
}

// Degraded system
{
  "status": "degraded",
  "degraded_services": ["ocr.label"],
  "timestamp": "2025-11-02T10:30:00Z"
}
```

---

## 2. Incident Response

### Severity Levels

| Level | Response Time | Description |
|-------|---------------|-------------|
| P0 | 15 minutes | Complete outage, data breach |
| P1 | 1 hour | Partial outage, critical feature down |
| P2 | 4 hours | Degraded performance, non-critical feature down |
| P3 | 24 hours | Minor issue, workaround available |
| P4 | 1 week | Enhancement, documentation |

### Incident Response Workflow

```
1. Alert Received
   ↓
2. Acknowledge (within response time)
   ↓
3. Assess Severity
   ↓
4. Investigate
   ├─ Check logs
   ├─ Check metrics
   ├─ Check recent deployments
   └─ Check external dependencies
   ↓
5. Mitigate
   ├─ Rollback deployment
   ├─ Scale resources
   ├─ Enable degraded mode
   └─ Disable problematic feature
   ↓
6. Communicate
   ├─ Update status page
   ├─ Notify customers
   └─ Update team
   ↓
7. Resolve
   ↓
8. Post-Mortem
```

---

## 3. Common Incidents

### High Latency

**Symptoms:**
- p95 latency > 150ms
- Slow API responses
- Timeouts

**Investigation:**
```bash
# Check current latency
curl https://api.claimlens.com/metrics | grep request_duration

# Check database connections
psql -h db.claimlens.com -U claimlens -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis
redis-cli -h redis.claimlens.com INFO stats

# Check transform performance
curl https://api.claimlens.com/api/v1/admin/performance
```

**Resolution:**
1. Scale API servers: `kubectl scale deployment/claimlens-api --replicas=6`
2. Check slow queries: Review database logs
3. Clear Redis cache if stale: `redis-cli FLUSHDB`
4. Restart services if memory leak: `kubectl rollout restart deployment/claimlens-api`

---

### High Error Rate

**Symptoms:**
- Error rate > 5%
- 500 errors in logs
- Failed requests

**Investigation:**
```bash
# Check error rate
curl https://api.claimlens.com/metrics | grep requests_failed

# Check recent errors
kubectl logs -l app=claimlens-api --tail=100 | grep ERROR

# Check database
psql -h db.claimlens.com -U claimlens -c "SELECT pg_is_in_recovery();"
```

**Resolution:**
1. Identify error pattern in logs
2. Rollback if recent deployment: `./scripts/rollback.sh`
3. Fix database connection pool: Restart API
4. Check external dependencies: MCP services, database

---

### Degraded Mode

**Symptoms:**
- Degraded mode banner visible
- MCP services unavailable
- Circuit breakers open

**Investigation:**
```bash
# Check degraded services
curl https://api.claimlens.com/health

# Check circuit breaker state
curl https://api.claimlens.com/metrics | grep circuit_breaker_state

# Check MCP service logs
kubectl logs -l app=mcp-services --tail=100
```

**Resolution:**
1. Restart failed MCP service: `kubectl rollout restart deployment/mcp-ocr-label`
2. Check resource limits: `kubectl top pods`
3. Scale if needed: `kubectl scale deployment/mcp-ocr-label --replicas=3`
4. Monitor recovery: Circuit breaker should close automatically

---

### Database Issues

**Symptoms:**
- Connection errors
- Slow queries
- Deadlocks

**Investigation:**
```bash
# Check connections
psql -h db.claimlens.com -U claimlens -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state;
"

# Check slow queries
psql -h db.claimlens.com -U claimlens -c "
  SELECT pid, now() - query_start as duration, query 
  FROM pg_stat_activity 
  WHERE state = 'active' 
  ORDER BY duration DESC 
  LIMIT 10;
"

# Check locks
psql -h db.claimlens.com -U claimlens -c "
  SELECT * FROM pg_locks WHERE NOT granted;
"
```

**Resolution:**
1. Kill long-running queries: `SELECT pg_terminate_backend(pid);`
2. Increase connection pool: Update `DATABASE_MAX_CONNECTIONS`
3. Optimize slow queries: Add indexes
4. Vacuum if bloated: `VACUUM ANALYZE;`

---

## 4. Scaling Procedures

### Scale API Servers

```bash
# Scale up
kubectl scale deployment/claimlens-api --replicas=6

# Scale down
kubectl scale deployment/claimlens-api --replicas=3

# Auto-scale
kubectl autoscale deployment/claimlens-api \
  --min=3 --max=10 --cpu-percent=70
```

### Scale Database

```bash
# Vertical scaling (increase resources)
# 1. Create snapshot
# 2. Modify instance type
# 3. Restart database
# 4. Verify connections

# Horizontal scaling (read replicas)
# 1. Create read replica
# 2. Update connection string for read queries
# 3. Monitor replication lag
```

### Scale Redis

```bash
# Add more memory
redis-cli CONFIG SET maxmemory 4gb

# Enable clustering
# 1. Create Redis cluster
# 2. Update connection string
# 3. Migrate data
```

---

## 5. Backup & Restore

### Database Backup

```bash
# Daily backup (automated)
pg_dump -h db.claimlens.com -U claimlens claimlens_prod \
  | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz \
  s3://claimlens-backups/database/

# Retention: 30 days
```

### Database Restore

```bash
# Download backup
aws s3 cp s3://claimlens-backups/database/backup-20251102.sql.gz .

# Restore
gunzip backup-20251102.sql.gz
psql -h db.claimlens.com -U claimlens claimlens_prod < backup-20251102.sql

# Verify
psql -h db.claimlens.com -U claimlens -c "SELECT count(*) FROM audits;"
```

### Audit Records Backup

```bash
# Export audit records
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.claimlens.com/v1/export/audits?start_date=2025-11-01&end_date=2025-11-02" \
  > audits-20251102.ndjson

# Upload to S3
aws s3 cp audits-20251102.ndjson s3://claimlens-backups/audits/
```

---

## 6. Data Retention & Purge

### Retention Policy

| Data Type | Retention | Purge Frequency |
|-----------|-----------|-----------------|
| Audit records | 90-365 days (tenant config) | Daily |
| Decision logs | 24 hours | Hourly |
| Performance metrics | 30 days | Weekly |
| Webhook failures | 7 days | Daily |

### Manual Purge

```bash
# Purge expired audit records
psql -h db.claimlens.com -U claimlens -c "
  DELETE FROM audits 
  WHERE ts < NOW() - INTERVAL '90 days';
"

# Purge old logs
kubectl logs -l app=claimlens-api --since=24h > /dev/null

# Purge old metrics
curl -X POST http://prometheus:9090/api/v1/admin/tsdb/delete_series \
  -d 'match[]={__name__=~".+"}&start=0&end=$(date -d "30 days ago" +%s)'
```

### Automated Purge Job

```yaml
# k8s/cronjob-purge.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: purge-expired-data
spec:
  schedule: "0 2 * * *" # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: purge
            image: claimlens/purge-job:latest
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: url
          restartPolicy: OnFailure
```

---

## 7. Security Incidents

### Data Breach Response

1. **Immediate Actions:**
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable audit logging
   - Notify security team

2. **Investigation:**
   - Review access logs
   - Identify scope of breach
   - Determine data exposed
   - Document timeline

3. **Remediation:**
   - Patch vulnerabilities
   - Rotate all secrets
   - Update security policies
   - Notify affected customers

4. **Post-Incident:**
   - Conduct post-mortem
   - Update security procedures
   - Implement additional controls
   - Train team

### API Key Leak

```bash
# Revoke compromised key
curl -X DELETE https://api.claimlens.com/v1/api-keys/$KEY_ID \
  -H "Authorization: Bearer $ADMIN_KEY"

# Generate new key
curl -X POST https://api.claimlens.com/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{"tenant_id": "tenant-001"}'

# Notify customer
# Send email with new key and security advisory
```

---

## 8. Deployment Procedures

### Standard Deployment

```bash
# 1. Run tests
pnpm test

# 2. Build
pnpm build

# 3. Deploy to staging
kubectl apply -f k8s/staging/

# 4. Run smoke tests
pnpm test:smoke --env=staging

# 5. Deploy to production (manual approval)
kubectl apply -f k8s/production/

# 6. Monitor for 15 minutes
./scripts/monitor-deployment.mjs

# 7. Verify
curl https://api.claimlens.com/health
```

### Rollback Procedure

```bash
# 1. Identify previous version
kubectl rollout history deployment/claimlens-api

# 2. Rollback
kubectl rollout undo deployment/claimlens-api

# 3. Verify
kubectl rollout status deployment/claimlens-api

# 4. Check health
curl https://api.claimlens.com/health

# 5. Notify team
# Post in Slack: "Rolled back to version X.Y.Z due to [reason]"
```

---

## 9. Monitoring & Alerts

### Key Metrics to Monitor

```
# Availability
- claimlens_requests_total
- claimlens_requests_failed

# Latency
- claimlens_request_duration_ms (p50, p95, p99)
- claimlens_transform_duration_ms

# Error Budget
- claimlens_error_budget_remaining

# Resources
- CPU usage
- Memory usage
- Database connections
- Redis memory

# Degraded Mode
- claimlens_degraded_services
- claimlens_circuit_breaker_state
```

### Alert Thresholds

```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    severity: critical
    
  - name: HighLatency
    condition: p95_latency > 150ms
    severity: warning
    
  - name: ErrorBudgetCritical
    condition: error_budget_remaining < 20%
    severity: critical
    
  - name: DegradedMode
    condition: degraded_services > 0
    severity: warning
    
  - name: DatabaseConnections
    condition: db_connections > 80%
    severity: warning
```

---

## 10. Maintenance Windows

### Scheduled Maintenance

```
# Frequency: Monthly (first Sunday, 2-4 AM IST)
# Duration: 2 hours
# Impact: Minimal (rolling updates)

Tasks:
- Database maintenance (VACUUM, ANALYZE)
- Index rebuilding
- Log rotation
- Certificate renewal
- Dependency updates
- Security patches
```

### Maintenance Procedure

```bash
# 1. Notify customers (48 hours advance)
# Send email: "Scheduled maintenance on [date]"

# 2. Enable maintenance mode
kubectl apply -f k8s/maintenance-mode.yaml

# 3. Perform maintenance
# - Database: VACUUM ANALYZE
# - Rotate logs
# - Update dependencies

# 4. Disable maintenance mode
kubectl delete -f k8s/maintenance-mode.yaml

# 5. Verify system health
curl https://api.claimlens.com/health

# 6. Notify customers (completion)
# Send email: "Maintenance completed successfully"
```

---

## 11. On-Call Procedures

### On-Call Rotation

```
# Rotation: Weekly
# Primary: Responds to all alerts
# Secondary: Backup if primary unavailable
# Escalation: Manager if unresolved after 2 hours
```

### On-Call Checklist

- [ ] PagerDuty app installed
- [ ] VPN access configured
- [ ] kubectl configured
- [ ] Database access verified
- [ ] Runbook bookmarked
- [ ] Team contacts saved
- [ ] Escalation path documented

### Handoff Procedure

```
1. Review open incidents
2. Check system health
3. Review recent deployments
4. Share context with next on-call
5. Update runbook if needed
```

---

## 12. Contact Information

### Team Contacts

```yaml
engineering:
  slack: #claimlens-eng
  email: eng@claimlens.com
  
operations:
  slack: #claimlens-ops
  email: ops@claimlens.com
  pagerduty: claimlens-ops
  
security:
  slack: #security-incidents
  email: security@claimlens.com
  pagerduty: claimlens-security
  
management:
  email: management@claimlens.com
```

### External Contacts

```yaml
aws_support:
  phone: +1-xxx-xxx-xxxx
  email: support@aws.amazon.com
  
database_vendor:
  phone: +1-xxx-xxx-xxxx
  email: support@timescale.com
```

---

## 13. References

- [System Architecture](./DESIGN_SYSTEM.md)
- [API Documentation](./API_SPEC.md)
- [Security Procedures](./SECURITY_PRIVACY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [CI/CD Pipeline](./CI_CD.md)
