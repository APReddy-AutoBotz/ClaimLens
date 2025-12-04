#!/usr/bin/env node
// ClaimLens Pre-commit Hook Wrapper (cross-platform)
import { execSync } from 'child_process';

console.log('🔍 Running pre-commit checks...\n');

const checks = [
  { name: 'Schema Validation', cmd: 'node scripts/validate-schemas.mjs' },
  { name: 'Signature Verification', cmd: 'node scripts/verify-signatures.mjs' },
  { name: 'Node.js Tests', cmd: 'pnpm test:node' },
  { name: 'Browser Tests', cmd: 'pnpm test:browser' },
  { name: 'Fixtures', cmd: 'pnpm test:fixtures' }
];

try {
  for (const check of checks) {
    console.log(`\n📋 ${check.name}...`);
    execSync(check.cmd, { stdio: 'inherit' });
  }
  
  console.log('\n✅ Pre-commit checks passed');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Pre-commit checks failed');
  process.exit(1);
}
