#!/usr/bin/env node
// ClaimLens Test Coverage Checker
// Ensures transforms have ≥80% test coverage

import { readFile, readdir } from 'fs/promises';
import { execSync } from 'child_process';

async function checkCoverage() {
  console.log('📊 ClaimLens Test Coverage Check\n');
  
  try {
    // Run tests with coverage
    console.log('Running tests with coverage...\n');
    execSync('pnpm test:node --coverage --reporter=json --reporter=default', { 
      stdio: 'inherit',
      env: { ...process.env, COVERAGE_THRESHOLD: '80' }
    });
    
    // Read coverage report
    let coverageData;
    try {
      const coverageContent = await readFile('coverage/coverage-summary.json', 'utf-8');
      coverageData = JSON.parse(coverageContent);
    } catch (error) {
      console.warn('⚠️  Coverage summary not found, checking for transforms...');
      
      // Fallback: check if transforms have test files
      const transformFiles = await readdir('packages/transforms');
      const transforms = transformFiles.filter(f => f.endsWith('.ts') && !f.includes('.spec.'));
      
      let missingTests = 0;
      console.log('\nTransform                Test Coverage');
      console.log('─────────────────────────────────────');
      
      for (const transform of transforms) {
        const baseName = transform.replace('.ts', '');
        const testFile = `packages/transforms/__tests__/${baseName}.spec.ts`;
        
        try {
          await readFile(testFile, 'utf-8');
          console.log(`${baseName.padEnd(24)} ✅ Has tests`);
        } catch {
          console.log(`${baseName.padEnd(24)} ❌ Missing tests`);
          missingTests++;
        }
      }
      
      if (missingTests > 0) {
        console.error(`\n❌ ${missingTests} transforms missing tests`);
        process.exit(1);
      }
      
      console.log('\n✅ All transforms have test files');
      return;
    }
    
    // Analyze coverage for transforms
    console.log('\n📈 Coverage Summary:\n');
    
    const transformCoverage = {};
    let belowThreshold = 0;
    
    for (const [file, metrics] of Object.entries(coverageData)) {
      if (file.includes('packages/transforms/') && !file.includes('__tests__')) {
        const fileName = file.split('/').pop().replace('.ts', '');
        const coverage = {
          statements: metrics.statements.pct,
          branches: metrics.branches.pct,
          functions: metrics.functions.pct,
          lines: metrics.lines.pct
        };
        
        transformCoverage[fileName] = coverage;
        
        // Check if below 80% threshold
        if (coverage.statements < 80 || coverage.lines < 80) {
          belowThreshold++;
        }
      }
    }
    
    console.log('Transform              Statements  Branches  Functions  Lines');
    console.log('───────────────────────────────────────────────────────────────');
    
    for (const [name, coverage] of Object.entries(transformCoverage)) {
      const stmtStr = `${coverage.statements}%`.padEnd(11);
      const branchStr = `${coverage.branches}%`.padEnd(9);
      const funcStr = `${coverage.functions}%`.padEnd(10);
      const lineStr = `${coverage.lines}%`;
      
      const status = (coverage.statements >= 80 && coverage.lines >= 80) ? '✅' : '❌';
      
      console.log(`${name.padEnd(22)} ${stmtStr} ${branchStr} ${funcStr} ${lineStr} ${status}`);
    }
    
    const totalCoverage = coverageData.total;
    console.log('\n📊 Overall Coverage:');
    console.log(`• Statements: ${totalCoverage.statements.pct}%`);
    console.log(`• Branches: ${totalCoverage.branches.pct}%`);
    console.log(`• Functions: ${totalCoverage.functions.pct}%`);
    console.log(`• Lines: ${totalCoverage.lines.pct}%`);
    
    if (belowThreshold > 0) {
      console.error(`\n❌ ${belowThreshold} transforms below 80% coverage threshold`);
      process.exit(1);
    }
    
    if (totalCoverage.statements.pct < 80 || totalCoverage.lines.pct < 80) {
      console.error('\n❌ Overall coverage below 80% threshold');
      process.exit(1);
    }
    
    console.log('\n✅ All transforms meet 80% coverage threshold');
    
  } catch (error) {
    console.error('❌ Coverage check failed:', error.message);
    process.exit(1);
  }
}

checkCoverage();
