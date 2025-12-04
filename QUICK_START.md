# ClaimLens Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development

```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:api        # API server (port 8080)
pnpm dev:admin      # Admin Console (port 3000)
pnpm dev:web        # Browser Extension (port 3001)
pnpm mcp:dev        # MCP mock services (ports 7001-7004)
```

### 3. Run Tests

```bash
# Quick test
pnpm test:unit

# Full test suite
pnpm test
```

### 4. View Documentation

```bash
# Start Storybook
pnpm storybook      # http://localhost:6006

# Serve docs
pnpm docs:serve     # http://localhost:8080
```

---

## 📋 Common Commands

### Development
```bash
pnpm dev                    # Start all services
pnpm dev:api                # API only
pnpm dev:admin              # Admin Console only
pnpm dev:web                # Extension only
pnpm mcp:dev                # MCP services
pnpm storybook              # Component library
```

### Testing
```bash
pnpm test                   # All tests
pnpm test:unit              # Unit tests
pnpm test:integration       # Integration tests
pnpm test:e2e               # E2E tests (Playwright)
pnpm test:coverage          # With coverage report
```

### Quality Gates
```bash
pnpm check:coverage         # Coverage ≥80%
pnpm check:budgets          # Latency budgets
pnpm verify:signatures      # Rule pack signatures
pnpm validate:schemas       # Schema validation
pnpm hooks:precommit        # All quality gates
```

### Build
```bash
pnpm build                  # Build all
pnpm build:api              # API only
pnpm build:admin            # Admin Console only
pnpm build:web              # Extension only
pnpm build-storybook        # Storybook static site
```

---

## 🎯 Quick Links

### Documentation
- [Requirements](.kiro/specs/claimlens-system/requirements.md) - 28 comprehensive requirements
- [Design](.kiro/specs/claimlens-system/design.md) - System architecture
- [Tasks](.kiro/specs/claimlens-system/tasks.md) - Implementation plan
- [PRD](docs/PRD.md) - Product requirements
- [API Spec](docs/API_SPEC.md) - API documentation

### Design & UX
- [Design System](docs/DESIGN_SYSTEM.md) - Colors, typography, components
- [UX Spec](docs/UX_SPEC.md) - User flows and screens
- [Motion & A11y](docs/MOTION_A11Y.md) - Animation and accessibility

### Operations
- [Runbook](docs/RUNBOOK.md) - Operations guide
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues
- [CI/CD](docs/CI_CD.md) - Pipeline documentation

### Security & Privacy
- [Security & Privacy](docs/SECURITY_PRIVACY.md) - Security guide
- [Observability](docs/OBSERVABILITY.md) - Monitoring and logging

---

## 🎨 Design Tokens

```css
/* Colors */
--color-ink: #0B1220;           /* Background */
--color-surface: #0F1628;       /* Secondary background */
--color-cloud: #F8FAFC;         /* Text */
--color-indigo: #4F46E5;        /* Primary */
--color-teal: #14B8A6;          /* Focus/links */
--color-emerald: #10B981;       /* Safe */
--color-amber: #F59E0B;         /* Caution */
--color-red: #EF4444;           /* Danger */

/* Glass Effect */
background: rgba(15, 22, 40, 0.55);
backdrop-filter: blur(14px);
border-radius: 16px;
```

---

## 🧪 Demo Mode

```bash
# Enable degraded mode
export DEGRADED_MODE=true
pnpm dev

# Disable specific MCP service
export MCP_OCR_DISABLED=true
pnpm dev

# Enable debug logging
export LOG_LEVEL=debug
pnpm dev
```

---

## 📊 Key Metrics

### Performance Targets
- API p95 latency: ≤150ms
- Extension viewport scan: ≤200ms
- Main thread blocking: ≤50ms

### Quality Targets
- Test coverage: ≥80%
- WCAG AA contrast: ≥4.5:1
- Focus indicators: 2px minimum

### SLO Targets
- Availability: 99.5%
- Error budget: 0.5% per 30 days
- Alert thresholds: 50% (warning), 80% (critical)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
pnpm install
pnpm build
```

### Tests Failing
```bash
# Clear cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install
```

---

## 📞 Get Help

- **Slack:** #claimlens-help
- **GitHub Issues:** For bugs
- **GitHub Discussions:** For questions
- **Email:** support@claimlens.com

---

## 🎓 Learning Path

### Day 1: Setup & Basics
1. Install dependencies
2. Start dev servers
3. Run tests
4. Explore Storybook

### Day 2: Architecture
1. Read requirements.md
2. Review design.md
3. Understand transform pipeline
4. Explore MCP services

### Day 3: Implementation
1. Pick a task from tasks.md
2. Write tests first
3. Implement feature
4. Run quality gates

### Day 4: Documentation
1. Update API docs
2. Add Storybook stories
3. Write tests
4. Submit PR

---

## ✅ Pre-Commit Checklist

- [ ] Tests passing (`pnpm test`)
- [ ] Coverage ≥80% (`pnpm check:coverage`)
- [ ] Latency budgets met (`pnpm check:budgets`)
- [ ] Signatures verified (`pnpm verify:signatures`)
- [ ] Linting clean (`pnpm lint`)
- [ ] Types valid (`pnpm type-check`)
- [ ] Documentation updated

---

## 🚢 Deployment Checklist

- [ ] All tests passing
- [ ] Staging tests passed
- [ ] Smoke tests passed
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring configured

---

**Happy Coding! 🎉**
