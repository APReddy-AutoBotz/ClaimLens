#!/usr/bin/env node
// ClaimLens PR Verification Hook Wrapper (cross-platform)
import { execSync } from 'child_process';

console.log('🚀 Running PR verification...\n');

const checks = [
  { name: 'Performance Tests', cmd: 'pnpm test:perf' },
  { name: 'Latency Budgets', cmd: 'pnpm check:budgets' },
  { name: 'E2E Tests', cmd: 'pnpm test:e2e' }
];

try {
  for (const check of checks) {
    console.log(`\n📋 ${check.name}...`);
    execSync(check.cmd, { stdio: 'inherit' });
  }
  
  console.log('\n✅ PR verification passed');
  process.exit(0);
} catch (error) {
  console.error('\n❌ PR verification failed');
  process.exit(1);
}
