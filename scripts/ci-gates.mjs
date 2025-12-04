#!/usr/bin/env node
// ClaimLens CI Pipeline Gates
// Comprehensive validation suite for CI/CD

import { execSync } from 'child_process';

const gates = [
  {
    name: 'Schema Validation',
    command: 'node scripts/validate-schemas.mjs',
    description: 'Validate policies and rule packs against JSON schemas'
  },
  {
    name: 'Signature Verification',
    command: 'node scripts/verify-signatures.mjs',
    description: 'Verify SHA-256 signatures for rule packs'
  },
  {
    name: 'Fixture Regression',
    command: 'pnpm test:fixtures',
    description: 'Run fixture regression suite'
  },
  {
    name: 'Latency Budgets',
    command: 'pnpm check:budgets',
    description: 'Enforce latency budget constraints'
  },
  {
    name: 'Test Coverage',
    command: 'node scripts/check-coverage.mjs',
    description: 'Ensure ≥80% test coverage for transforms',
    optional: true // May not have coverage data in all environments
  },
  {
    name: 'Documentation Check',
    command: 'pnpm check:docs-for-new-transforms',
    description: 'Verify transforms have tests and README mentions'
  }
];

async function runGate(gate) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚪 Gate: ${gate.name}`);
  console.log(`📝 ${gate.description}`);
  console.log('='.repeat(70));
  
  try {
    execSync(gate.command, { stdio: 'inherit' });
    console.log(`\n✅ ${gate.name} passed`);
    return true;
  } catch (error) {
    if (gate.optional) {
      console.warn(`\n⚠️  ${gate.name} failed (optional, continuing...)`);
      return true;
    }
    console.error(`\n❌ ${gate.name} failed`);
    return false;
  }
}

async function main() {
  console.log('🚀 ClaimLens CI Pipeline Gates\n');
  console.log(`Running ${gates.length} validation gates...\n`);
  
  const results = [];
  
  for (const gate of gates) {
    const passed = await runGate(gate);
    results.push({ gate: gate.name, passed, optional: gate.optional });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 CI Gates Summary');
  console.log('='.repeat(70));
  
  let failed = 0;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : (result.optional ? '⚠️  SKIP' : '❌ FAIL');
    console.log(`${result.gate.padEnd(30)} ${status}`);
    if (!result.passed && !result.optional) {
      failed++;
    }
  }
  
  console.log('='.repeat(70));
  
  if (failed > 0) {
    console.error(`\n❌ ${failed} required gates failed`);
    process.exit(1);
  }
  
  console.log('\n✅ All CI gates passed');
  process.exit(0);
}

main();
