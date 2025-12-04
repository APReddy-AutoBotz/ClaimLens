# Troubleshooting Guide — ClaimLens

## Overview

Common issues, solutions, and debugging techniques for ClaimLens development and operations.

---

## 1. Development Environment

### Port Conflicts

**Problem:** Port already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

---

### CORS Errors

**Problem:** CORS policy blocking requests

```
Access to fetch at 'http://localhost:8080/api/v1/menu/feed' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

```typescript
// app/api/server.ts
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

```bash
# .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

### Module Not Found

**Problem:** Cannot find module

```
Error: Cannot find module '@claimlens/transforms'
```

**Solution:**

```bash
# Reinstall dependencies
pnpm install

# Clear cache
pnpm store prune

# Rebuild
pnpm build

# Check tsconfig paths
cat tsconfig.json | grep paths
```

---

## 2. Testing Issues

### Playwright Browser Not Found

**Problem:** Playwright can't find browsers

```
Error: browserType.launch: Executable doesn't exist
```

**Solution:**

```bash
# Install browsers
pnpm exec playwright install

# Install with dependencies
pnpm exec playwright install --with-deps

# Check installation
pnpm exec playwright --version
```

---

### Vitest Timeout

**Problem:** Tests timing out

```
Error: Test timed out in 5000ms
```

**Solution:**

```typescript
// Increase timeout for specific test
test('slow operation', async () => {
  // ...
}, { timeout: 10000 });

// Or in config
export default defineConfig({
  test: {
    testTimeout: 10000
  }
});
```

---

### Mock Not Working

**Problem:** Mock not being called

```typescript
// ❌ Wrong - mock after import
import { processItem } from './processor';
vi.mock('./processor');

// ✅ Correct - mock before import
vi.mock('./processor');
import { processItem } from './processor';
```

---

## 3. API Issues

### 401 Unauthorized

**Problem:** API key not accepted

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key is missing or invalid"
  }
}
```

**Solution:**

```bash
# Check API key format
echo $API_KEY

# Verify in header
curl -H "Authorization: Bearer $API_KEY" \
  https://api.claimlens.com/health

# Generate new key
curl -X POST https://api.claimlens.com/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{"tenant_id": "tenant-001"}'
```

---

### 429 Rate Limit

**Problem:** Too many requests

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded"
  },
  "retry_after": 42
}
```

**Solution:**

```typescript
// Implement exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

### Slow Response Times

**Problem:** API responses taking > 150ms

**Investigation:**

```bash
# Check latency metrics
curl https://api.claimlens.com/metrics | grep request_duration

# Check specific route
curl -w "@curl-format.txt" -o /dev/null -s \
  https://api.claimlens.com/v1/menu/feed

# curl-format.txt
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

**Solution:**

1. Check database query performance
2. Review transform execution times
3. Check Redis cache hit rate
4. Scale API servers if needed

---

## 4. Database Issues

### Connection Pool Exhausted

**Problem:** No available connections

```
Error: Connection pool exhausted
```

**Solution:**

```typescript
// Increase pool size
const pool = new Pool({
  max: 20, // Increase from default 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Or check for connection leaks
// Always release connections
const client = await pool.connect();
try {
  await client.query('SELECT * FROM audits');
} finally {
  client.release(); // Important!
}
```

---

### Slow Queries

**Problem:** Queries taking > 1s

**Investigation:**

```sql
-- Find slow queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC 
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename = 'audits'
ORDER BY abs(correlation) DESC;
```

**Solution:**

```sql
-- Add index
CREATE INDEX idx_audits_tenant_ts ON audits(tenant_id, ts DESC);

-- Analyze table
ANALYZE audits;

-- Vacuum if bloated
VACUUM ANALYZE audits;
```

---

### Migration Failures

**Problem:** Migration fails midway

```
Error: relation "audits" already exists
```

**Solution:**

```bash
# Rollback migration
pnpm migrate:rollback

# Check migration status
pnpm migrate:status

# Run specific migration
pnpm migrate:up 20251102_add_audit_index

# Force migration (use with caution)
pnpm migrate:force 20251102_add_audit_index
```

---

## 5. Redis Issues

### Connection Refused

**Problem:** Can't connect to Redis

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**

```bash
# Check Redis is running
redis-cli ping

# Start Redis
# Windows
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Check connection
redis-cli -h localhost -p 6379 INFO
```

---

### Memory Issues

**Problem:** Redis out of memory

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**

```bash
# Check memory usage
redis-cli INFO memory

# Increase maxmemory
redis-cli CONFIG SET maxmemory 4gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Clear cache if needed
redis-cli FLUSHDB
```

---

## 6. MCP Service Issues

### Service Unavailable

**Problem:** MCP service not responding

```
Error: Circuit breaker open for ocr.label
```

**Investigation:**

```bash
# Check service health
curl http://localhost:7001/health

# Check logs
kubectl logs -l app=mcp-ocr-label --tail=100

# Check circuit breaker state
curl https://api.claimlens.com/metrics | grep circuit_breaker_state
```

**Solution:**

```bash
# Restart service
kubectl rollout restart deployment/mcp-ocr-label

# Scale up
kubectl scale deployment/mcp-ocr-label --replicas=3

# Check recovery
watch -n 1 'curl -s http://localhost:7001/health'
```

---

### Timeout Errors

**Problem:** MCP service timing out

```
Error: Timeout after 500ms
```

**Solution:**

```yaml
# Increase timeout in degraded-mode-matrix.yaml
services:
  ocr.label:
    timeout_ms: 1000  # Increase from 500ms
```

```typescript
// Or in code
const result = await mcpService.call('ocr.label', payload, {
  timeout: 1000
});
```

---

## 7. Browser Extension Issues

### Extension Not Loading

**Problem:** Extension doesn't appear in browser

**Solution:**

```bash
# Rebuild extension
pnpm build:web

# Load unpacked extension
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select app/web/dist folder

# Check for errors
# Open extension popup → Right-click → Inspect
```

---

### Content Script Not Injecting

**Problem:** Badges not appearing on page

**Investigation:**

```javascript
// Check if content script loaded
console.log('ClaimLens content script loaded');

// Check domain allowlist
chrome.storage.local.get('allowlist', (result) => {
  console.log('Allowlist:', result.allowlist);
});

// Check permissions
chrome.permissions.getAll((permissions) => {
  console.log('Permissions:', permissions);
});
```

**Solution:**

```json
// manifest.json - Add host permissions
{
  "host_permissions": [
    "https://swiggy.com/*",
    "https://zomato.com/*"
  ]
}
```

---

### CSP Violations

**Problem:** Content Security Policy blocking scripts

```
Refused to execute inline script because it violates CSP
```

**Solution:**

```typescript
// ❌ Don't use inline scripts
element.innerHTML = '<script>alert("hi")</script>';

// ✅ Use DOM manipulation
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
document.head.appendChild(script);
```

---

## 8. Build Issues

### TypeScript Errors

**Problem:** Type errors during build

```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution:**

```typescript
// Fix type errors
const value: number = parseInt(stringValue, 10);

// Or use type assertion (use sparingly)
const value = stringValue as unknown as number;

// Check tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

---

### Vite Build Fails

**Problem:** Vite build errors

```
Error: Could not resolve './component' from src/App.tsx
```

**Solution:**

```bash
# Clear cache
rm -rf node_modules/.vite

# Rebuild
pnpm build

# Check vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

---

## 9. Performance Issues

### High Memory Usage

**Problem:** Node process using > 2GB memory

**Investigation:**

```bash
# Check memory usage
node --max-old-space-size=4096 app.js

# Profile memory
node --inspect app.js
# Open chrome://inspect
# Take heap snapshot
```

**Solution:**

```typescript
// Fix memory leaks
// ❌ Don't store large objects in memory
const cache = new Map(); // Grows indefinitely

// ✅ Use LRU cache with size limit
import LRU from 'lru-cache';
const cache = new LRU({ max: 500 });

// ✅ Clean up event listeners
emitter.on('event', handler);
// Later...
emitter.off('event', handler);
```

---

### CPU Spikes

**Problem:** CPU usage at 100%

**Investigation:**

```bash
# Profile CPU
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Check for infinite loops
# Check for blocking operations
```

**Solution:**

```typescript
// ❌ Don't block event loop
const result = heavyComputation(); // Blocks

// ✅ Use worker threads
import { Worker } from 'worker_threads';
const worker = new Worker('./heavy-computation.js');
worker.postMessage(data);
```

---

## 10. CI/CD Issues

### Tests Failing in CI

**Problem:** Tests pass locally but fail in CI

**Common Causes:**

1. **Timing issues:**
```typescript
// ❌ Flaky test
await page.click('button');
expect(page.locator('.result')).toBeVisible();

// ✅ Wait for element
await page.click('button');
await page.waitForSelector('.result');
expect(page.locator('.result')).toBeVisible();
```

2. **Environment differences:**
```bash
# Check Node version
node --version

# Check environment variables
env | grep CLAIMLENS
```

3. **Race conditions:**
```typescript
// ❌ Race condition
Promise.all([operation1(), operation2()]);

// ✅ Sequential
await operation1();
await operation2();
```

---

### Deployment Fails

**Problem:** Deployment fails with error

**Investigation:**

```bash
# Check GitHub Actions logs
gh run view --log

# Check kubectl events
kubectl get events --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods -l app=claimlens-api
kubectl describe pod <pod-name>
```

**Solution:**

```bash
# Rollback deployment
kubectl rollout undo deployment/claimlens-api

# Fix issue and redeploy
git revert HEAD
git push origin main
```

---

## 11. Latency Budget Violations

**Problem:** Route exceeds latency budget

```
❌ Latency budget exceeded:
  - /menu/feed: 180ms > 150ms
```

**Investigation:**

```bash
# Check transform performance
curl https://api.claimlens.com/api/v1/admin/performance

# Profile specific transform
pnpm test:perf -- --transform=rewrite.disclaimer
```

**Solution:**

1. **Optimize transform:**
```typescript
// ❌ Slow - multiple regex passes
text = text.replace(/pattern1/g, 'replacement1');
text = text.replace(/pattern2/g, 'replacement2');

// ✅ Fast - single pass
text = text.replace(/pattern1|pattern2/g, (match) => {
  return match === 'pattern1' ? 'replacement1' : 'replacement2';
});
```

2. **Cache results:**
```typescript
const cache = new LRU({ max: 1000 });
const cacheKey = hash(item.content + profile + locale);
const cached = cache.get(cacheKey);
if (cached) return cached;
```

3. **Parallelize transforms:**
```typescript
// ❌ Sequential
for (const transform of transforms) {
  await transform(item);
}

// ✅ Parallel (if independent)
await Promise.all(transforms.map(t => t(item)));
```

---

## 12. Debugging Tips

### Enable Debug Logging

```bash
# Set log level
export LOG_LEVEL=debug

# Enable specific module
export DEBUG=claimlens:transforms:*

# Run with debug
pnpm dev
```

### Use Debugger

```typescript
// Add breakpoint
debugger;

// Or use VS Code
// 1. Set breakpoint in editor
// 2. Press F5
// 3. Select "Node.js" configuration
```

### Inspect Network Requests

```bash
# Use curl with verbose
curl -v https://api.claimlens.com/v1/menu/feed

# Or use httpie
http -v POST https://api.claimlens.com/v1/menu/feed

# Check request/response headers
curl -I https://api.claimlens.com/health
```

---

## 13. Getting Help

### Before Asking for Help

- [ ] Check this troubleshooting guide
- [ ] Search existing issues on GitHub
- [ ] Check logs for error messages
- [ ] Try to reproduce in isolation
- [ ] Document steps to reproduce

### Where to Ask

1. **Slack:** #claimlens-help
2. **GitHub Issues:** For bugs
3. **GitHub Discussions:** For questions
4. **Email:** support@claimlens.com

### What to Include

```
**Problem:**
Brief description of the issue

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: Windows 11
- Node: v20.0.0
- pnpm: 8.0.0
- Browser: Chrome 119

**Logs:**
```
Paste relevant logs here
```

**Screenshots:**
Attach if applicable
```

---

## 14. References

- [Runbook](./RUNBOOK.md)
- [API Documentation](./API_SPEC.md)
- [CI/CD Pipeline](./CI_CD.md)
- [Security Guide](./SECURITY_PRIVACY.md)
