#!/usr/bin/env node
// ClaimLens Release Gate Hook Wrapper (cross-platform)
import { execSync } from 'child_process';

console.log('🚪 Running release gate checks...\n');

const checks = [
  { name: 'Schema Validation', cmd: 'node scripts/validate-schemas.mjs' },
  { name: 'Signature Verification', cmd: 'node scripts/verify-signatures.mjs' },
  { name: 'Documentation Check', cmd: 'pnpm check:docs-for-new-transforms' },
  { name: 'Test Coverage', cmd: 'node scripts/check-coverage.mjs', optional: true },
  { name: 'All CI Gates', cmd: 'node scripts/ci-gates.mjs' }
];

try {
  for (const check of checks) {
    console.log(`\n📋 ${check.name}...`);
    try {
      execSync(check.cmd, { stdio: 'inherit' });
    } catch (error) {
      if (check.optional) {
        console.warn(`⚠️  ${check.name} failed (optional, continuing...)`);
      } else {
        throw error;
      }
    }
  }
  
  console.log('\n✅ Release gate passed');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Release gate failed');
  process.exit(1);
}
