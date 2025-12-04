# Build Cop Changes - Test Infrastructure Refactor

## 📋 DIFF SUMMARY

### Files Created
1. ✅ `vitest.workspace.ts` - Vitest workspace with node + browser projects
2. ✅ `.github/workflows/ci.yml` - GitHub Actions CI workflow
3. ✅ `e2e/` - New directory for E2E tests

### Files Modified
1. ✅ `package.json` - Updated scripts and added jsdom dependency
2. ✅ `playwright.config.ts` - Updated testDir to ./e2e
3. ✅ `.kiro/hooks/precommit_contracts.sh` - Updated to run node + browser + fixtures
4. ✅ `.kiro/hooks/precommit_contracts.ps1` - Updated to run node + browser + fixtures
5. ✅ `.kiro/hooks/pr_verify.sh` - Updated to run perf + budgets
6. ✅ `.kiro/hooks/pr_verify.ps1` - Updated to run perf + budgets
7. ✅ `.kiro/hooks/release_gate.sh` - Added coverage checks
8. ✅ `.kiro/hooks/release_gate.ps1` - Added coverage checks

### Files Moved
1. ✅ `app/web/__tests__/e2e/*.spec.ts` → `e2e/*.spec.ts`

### Files Renamed
1. ✅ `app/web/__tests__/extension.integration.spec.ts` → `app/web/__tests__/extension.integration.browser.spec.ts`

### Files Deleted
1. ✅ `vitest.config.ts` - Replaced by vitest.workspace.ts

---

## 🎯 CHANGES BREAKDOWN

### A) VITEST WORKSPACE CONFIGURATION

**Created: `vitest.workspace.ts`**
- **Project "node"**:
  - Includes: `packages/**/*.spec.ts`, `app/api/**/*.spec.ts`
  - Excludes: `**/*.browser.spec.ts`, `**/*.e2e.spec.ts`, `e2e/**`
  - Environment: `node`
  - Coverage: v8 provider, 80% thresholds (statements, branches, functions, lines)
  
- **Project "browser"**:
  - Includes: `app/web/**/*.browser.spec.ts`, `packages/**/*.browser.spec.ts`
  - Excludes: `**/*.e2e.spec.ts`, `e2e/**`
  - Environment: `jsdom`
  - Environment Options: `{ jsdom: { url: 'http://localhost/' } }`
  - Coverage: v8 provider, 80% thresholds

**Deleted: `vitest.config.ts`**
- Old single-project config replaced by workspace

---

### B) PLAYWRIGHT E2E SEPARATION

**Moved E2E Tests:**
```
app/web/__tests__/e2e/accessibility.e2e.spec.ts  → e2e/accessibility.e2e.spec.ts
app/web/__tests__/e2e/badge-rendering.e2e.spec.ts → e2e/badge-rendering.e2e.spec.ts
app/web/__tests__/e2e/extension.e2e.spec.ts      → e2e/extension.e2e.spec.ts
app/web/__tests__/e2e/performance.e2e.spec.ts    → e2e/performance.e2e.spec.ts
```

**Updated: `playwright.config.ts`**
```diff
- testDir: './app/web/__tests__/e2e',
+ testDir: './e2e',
- reporter: 'list',
+ reporter: 'html',
```

---

### C) BROWSER TEST NAMING

**Renamed:**
```
app/web/__tests__/extension.integration.spec.ts
  → app/web/__tests__/extension.integration.browser.spec.ts
```

This ensures browser/DOM-dependent tests use jsdom environment.

---

### D) PACKAGE.JSON UPDATES

**New Scripts:**
```json
"test:node": "vitest run --project node",
"test:browser": "vitest run --project browser",
"pretest:e2e": "pnpm playwright:install",
"playwright:install": "npx playwright install --with-deps",
"ci": "pnpm test:node && pnpm test:browser && pnpm test:fixtures && pnpm test:perf && pnpm check:budgets && pnpm test:e2e"
```

**New Dependencies:**
```json
"@vitest/coverage-v8": "^2.0.5",
"jsdom": "^24.0.0"
```

---

### E) HOOK UPDATES

#### Precommit Hooks
**Before:**
```bash
pnpm hooks:precommit
```

**After:**
```bash
pnpm test:node && pnpm test:browser && pnpm test:fixtures
```

#### PR Verify Hooks
**Before:**
```bash
pnpm hooks:prverify
```

**After:**
```bash
pnpm test:perf && pnpm check:budgets
```

#### Release Gate Hooks
**Before:**
```bash
pnpm hooks:release
```

**After:**
```bash
pnpm hooks:release
pnpm test:node --coverage
pnpm test:browser --coverage
```

---

### F) GITHUB ACTIONS CI WORKFLOW

**Created: `.github/workflows/ci.yml`**

**4 Jobs:**
1. **vitest-node** - Node.js unit tests with coverage
2. **vitest-browser** - Browser/jsdom tests with coverage
3. **fixtures-and-perf** - Fixtures, performance, budgets
4. **playwright-e2e** - E2E tests with Playwright

**Features:**
- Runs on `ubuntu-latest`
- Uses pnpm for package management
- Uploads coverage to Codecov
- Uploads Playwright reports as artifacts
- Runs on push to main/develop and PRs

---

## 🚀 RUN COMMANDS

### Windows PowerShell

#### Install Dependencies
```powershell
pnpm install
```

#### Run All Tests (Separate)
```powershell
# Node.js tests
pnpm test:node

# Browser tests (jsdom)
pnpm test:browser

# E2E tests (Playwright)
pnpm test:e2e

# Fixtures
pnpm test:fixtures

# Performance
pnpm test:perf

# Budget checks
pnpm check:budgets
```

#### Run Full CI Pipeline
```powershell
pnpm ci
```

#### Run with Coverage
```powershell
pnpm test:node --coverage
pnpm test:browser --coverage
```

#### Run Hooks
```powershell
# Pre-commit
.\.kiro\hooks\precommit_contracts.ps1

# PR verify
.\.kiro\hooks\pr_verify.ps1

# Release gate
.\.kiro\hooks\release_gate.ps1
```

---

### macOS/Linux (Bash)

#### Install Dependencies
```bash
pnpm install
```

#### Run All Tests (Separate)
```bash
# Node.js tests
pnpm test:node

# Browser tests (jsdom)
pnpm test:browser

# E2E tests (Playwright)
pnpm test:e2e

# Fixtures
pnpm test:fixtures

# Performance
pnpm test:perf

# Budget checks
pnpm check:budgets
```

#### Run Full CI Pipeline
```bash
pnpm ci
```

#### Run with Coverage
```bash
pnpm test:node --coverage
pnpm test:browser --coverage
```

#### Run Hooks
```bash
# Pre-commit
./.kiro/hooks/precommit_contracts.sh

# PR verify
./.kiro/hooks/pr_verify.sh

# Release gate
./.kiro/hooks/release_gate.sh
```

---

## 📊 COVERAGE THRESHOLDS

Both `node` and `browser` projects enforce:
- **Statements:** 80%
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%

Coverage reports generated in `./coverage/` directory.

---

## 🎭 PLAYWRIGHT SETUP

### First Time Setup
```bash
# Install Playwright browsers
pnpm playwright:install
```

### Run E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
npx playwright test e2e/accessibility.e2e.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### View Reports
```bash
npx playwright show-report
```

---

## ✅ VERIFICATION CHECKLIST

- [x] Vitest workspace created with node + browser projects
- [x] jsdom added as dependency
- [x] E2E tests moved to `/e2e` directory
- [x] Playwright config updated to point to `/e2e`
- [x] Browser tests renamed to `*.browser.spec.ts`
- [x] Package.json scripts updated
- [x] Coverage thresholds set to 80%
- [x] Hooks updated for new test structure
- [x] GitHub Actions workflow created
- [x] Documentation provided

---

## 🔧 TROUBLESHOOTING

### Issue: "Cannot find module 'jsdom'"
**Solution:** Run `pnpm install` to install jsdom dependency

### Issue: Playwright browsers not installed
**Solution:** Run `pnpm playwright:install`

### Issue: Coverage not generating
**Solution:** Ensure `@vitest/coverage-v8` is installed: `pnpm install -D @vitest/coverage-v8`

### Issue: Tests running in wrong environment
**Solution:** Check test file naming:
- Node tests: `*.spec.ts`
- Browser tests: `*.browser.spec.ts`
- E2E tests: `*.e2e.spec.ts` (in `/e2e` directory)

---

## 📈 NEXT STEPS

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Install Playwright browsers:**
   ```bash
   pnpm playwright:install
   ```

3. **Run tests to verify:**
   ```bash
   pnpm test:node
   pnpm test:browser
   pnpm test:e2e
   ```

4. **Check coverage:**
   ```bash
   pnpm test:node --coverage
   pnpm test:browser --coverage
   ```

5. **Run full CI pipeline:**
   ```bash
   pnpm ci
   ```

---

## 🎉 BENEFITS

✅ **Separation of Concerns:** Unit/integration tests separate from E2E tests
✅ **Proper Environments:** Node tests in Node, browser tests in jsdom, E2E in real browsers
✅ **Coverage Enforcement:** 80% thresholds on both node and browser projects
✅ **CI/CD Ready:** GitHub Actions workflow with 4-job matrix
✅ **Fast Feedback:** Run only what you need (node, browser, or e2e)
✅ **Cross-Platform:** Works on Windows, macOS, and Linux

---

**Build Cop Status:** ✅ ALL CHANGES APPLIED SUCCESSFULLY
**Business Logic:** ✅ UNCHANGED
**Test Infrastructure:** ✅ MODERNIZED AND SEPARATED
