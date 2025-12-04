# CI/CD Pipeline — ClaimLens

## Overview

ClaimLens uses GitHub Actions for continuous integration and deployment with automated quality gates.

---

## 1. Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Push/PR                                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─► Unit Tests (Vitest)
                 │   ├─ Node tests
                 │   └─ Browser tests (jsdom)
                 │
                 ├─► Integration Tests
                 │   ├─ Transform pipeline
                 │   └─ API endpoints
                 │
                 ├─► E2E Tests (Playwright)
                 │   ├─ Admin Console
                 │   └─ Browser Extension
                 │
                 ├─► Security Scans
                 │   ├─ SAST (Semgrep)
                 │   ├─ Dependency audit
                 │   └─ Secret scanning
                 │
                 ├─► Quality Gates
                 │   ├─ Coverage ≥80%
                 │   ├─ Latency budgets
                 │   ├─ Schema validation
                 │   ├─ Signature verification
                 │   └─ Documentation check
                 │
                 └─► Deploy
                     ├─ Staging (auto)
                     └─ Production (manual)
```

---

## 2. GitHub Actions Workflow

### .github/workflows/ci.yml

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # ========================================
  # Unit Tests
  # ========================================
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests (Node)
        run: pnpm test:unit
      
      - name: Run unit tests (Browser)
        run: pnpm test:browser
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit

  # ========================================
  # Integration Tests
  # ========================================
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/claimlens_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: integration

  # ========================================
  # E2E Tests
  # ========================================
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
      
      - name: Build applications
        run: pnpm build
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # ========================================
  # Security Scans
  # ========================================
  security:
    name: Security Scans
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
      
      - name: Dependency audit
        run: pnpm audit --audit-level=moderate
      
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  # ========================================
  # Quality Gates
  # ========================================
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration]
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Check coverage threshold
        run: pnpm check:coverage
      
      - name: Validate schemas
        run: pnpm validate:schemas
      
      - name: Verify rule pack signatures
        run: pnpm verify:signatures
      
      - name: Check latency budgets
        run: pnpm check:budgets
      
      - name: Verify documentation
        run: pnpm check:docs
      
      - name: Lint code
        run: pnpm lint
      
      - name: Type check
        run: pnpm type-check

  # ========================================
  # Build
  # ========================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration, test-e2e, security, quality-gates]
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build all packages
        run: pnpm build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/
            app/admin/dist/
            app/web/dist/

  # ========================================
  # Deploy Staging
  # ========================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.claimlens.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
      
      - name: Deploy to staging
        run: |
          # Deploy logic here
          echo "Deploying to staging..."
      
      - name: Run smoke tests
        run: pnpm test:smoke --env=staging

  # ========================================
  # Deploy Production
  # ========================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.claimlens.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
      
      - name: Deploy to production
        run: |
          # Deploy logic here
          echo "Deploying to production..."
      
      - name: Run smoke tests
        run: pnpm test:smoke --env=production
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 3. Test Scripts

### package.json

```json
{
  "scripts": {
    "test": "pnpm test:unit && pnpm test:integration && pnpm test:e2e",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:watch": "vitest watch",
    
    "check:coverage": "node scripts/check-coverage.mjs",
    "check:budgets": "node scripts/check-budgets.mjs",
    "check:docs": "node scripts/check-docs.mjs",
    
    "validate:schemas": "node scripts/validate-schemas.mjs",
    "verify:signatures": "node scripts/verify-signatures.mjs",
    
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    
    "build": "pnpm build:transforms && pnpm build:api && pnpm build:admin && pnpm build:web",
    "build:transforms": "tsc -p packages/transforms/tsconfig.json",
    "build:api": "tsc -p app/api/tsconfig.json",
    "build:admin": "vite build app/admin",
    "build:web": "vite build app/web"
  }
}
```

---

## 4. Vitest Configuration

### vitest.config.ts (Node tests)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.spec.ts'],
    exclude: ['**/__tests__/**/*.browser.spec.ts', '**/__tests__/**/*.e2e.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/__tests__/**',
        '**/*.spec.ts',
        'dist/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

### vitest.browser.config.ts (Browser tests)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.browser.spec.ts'],
    setupFiles: ['./app/web/__tests__/setup.ts']
  }
});
```

---

## 5. Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './app',
  testMatch: '**/__tests__/**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

---

## 6. Quality Gate Scripts

### scripts/check-coverage.mjs

```javascript
import fs from 'fs';

const coverage = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf8'));
const threshold = 80;

const metrics = ['lines', 'statements', 'functions', 'branches'];
const failures = [];

for (const metric of metrics) {
  const pct = coverage.total[metric].pct;
  if (pct < threshold) {
    failures.push(`${metric}: ${pct}% (threshold: ${threshold}%)`);
  }
}

if (failures.length > 0) {
  console.error('❌ Coverage threshold not met:');
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('✅ Coverage threshold met');
```

### scripts/check-budgets.mjs

```javascript
import fs from 'fs';
import yaml from 'yaml';

const perfResults = JSON.parse(fs.readFileSync('./dist/perf-results.json', 'utf8'));
const policies = yaml.parse(fs.readFileSync('./.kiro/specs/policies.yaml', 'utf8'));

const failures = [];

for (const [route, budget] of Object.entries(policies.routes)) {
  const actual = perfResults[route]?.p95;
  const threshold = budget.latency_budget_ms;
  
  if (actual > threshold) {
    failures.push(`${route}: ${actual}ms > ${threshold}ms`);
  }
}

if (failures.length > 0) {
  console.error('❌ Latency budget exceeded:');
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('✅ Latency budgets met');
```

### scripts/verify-signatures.mjs

```javascript
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const packsDir = './packs';
const failures = [];

const packs = fs.readdirSync(packsDir).filter(f => f.endsWith('.yaml'));

for (const pack of packs) {
  const packPath = path.join(packsDir, pack);
  const sigPath = `${packPath}.sig`;
  
  if (!fs.existsSync(sigPath)) {
    failures.push(`${pack}: Missing signature file`);
    continue;
  }
  
  const content = fs.readFileSync(packPath, 'utf8');
  const signature = JSON.parse(fs.readFileSync(sigPath, 'utf8'));
  
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  
  if (hash !== signature.sha256) {
    failures.push(`${pack}: Signature mismatch`);
  }
}

if (failures.length > 0) {
  console.error('❌ Signature verification failed:');
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('✅ All signatures verified');
```

---

## 7. Pre-commit Hooks

### .husky/pre-commit

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
pnpm lint-staged

# Run unit tests
pnpm test:unit

# Check types
pnpm type-check
```

### .husky/pre-push

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run all tests
pnpm test

# Check coverage
pnpm check:coverage

# Verify signatures
pnpm verify:signatures
```

---

## 8. Deployment Strategy

### Staging Deployment

```yaml
# Automatic on push to develop
- Runs all tests
- Deploys to staging environment
- Runs smoke tests
- Notifies team on Slack
```

### Production Deployment

```yaml
# Manual approval required
- Runs all tests
- Requires approval from maintainer
- Deploys to production with blue-green strategy
- Runs smoke tests
- Monitors error rates for 15 minutes
- Auto-rollback if error rate > 5%
- Notifies team on Slack
```

---

## 9. Monitoring & Rollback

### Post-Deployment Monitoring

```typescript
// scripts/monitor-deployment.mjs
async function monitorDeployment() {
  const startTime = Date.now();
  const duration = 15 * 60 * 1000; // 15 minutes
  
  while (Date.now() - startTime < duration) {
    const errorRate = await getErrorRate();
    
    if (errorRate > 0.05) { // 5%
      console.error(`❌ Error rate ${errorRate * 100}% exceeds threshold`);
      await rollback();
      process.exit(1);
    }
    
    await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
  }
  
  console.log('✅ Deployment stable');
}
```

### Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

echo "Rolling back to previous version..."

# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD^)

# Deploy previous version
kubectl set image deployment/claimlens-api \
  claimlens-api=claimlens/api:$PREVIOUS_VERSION

# Wait for rollout
kubectl rollout status deployment/claimlens-api

echo "Rollback complete"
```

---

## 10. CI/CD Checklist

### Before Merge

- [ ] All tests passing
- [ ] Coverage ≥80%
- [ ] Latency budgets met
- [ ] Signatures verified
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Code reviewed
- [ ] Changelog updated

### Before Deploy

- [ ] Staging tests passed
- [ ] Smoke tests passed
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring alerts configured

### After Deploy

- [ ] Smoke tests passed
- [ ] Error rates normal
- [ ] Latency within SLOs
- [ ] No degraded services
- [ ] Team notified
- [ ] Documentation updated

---

## 11. References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Semantic Release](https://semantic-release.gitbook.io/)
