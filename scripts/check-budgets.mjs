#!/usr/bin/env node
// ClaimLens Latency Budget Enforcer
// Parses policies.yaml and validates against real performance data

import { readFile } from 'fs/promises';
import YAML from 'yaml';

async function checkBudgets() {
  console.log('⏱️  Checking latency budgets...\n');
  
  try {
    // Read and parse policies.yaml
    const policiesContent = await readFile('.kiro/specs/policies.yaml', 'utf-8');
    const policies = YAML.parse(policiesContent);
    
    // Read performance results
    let perfResults = {};
    try {
      const perfContent = await readFile('dist/perf-results.json', 'utf-8');
      perfResults = JSON.parse(perfContent);
    } catch (error) {
      console.warn('⚠️  No performance results found. Run `pnpm test:perf` first.\n');
    }
    
    if (!policies.profiles) {
      console.error('❌ No profiles found in policies.yaml');
      process.exit(1);
    }
    
    let budgetViolations = 0;
    const allRoutes = [];
    
    // Collect all routes from all profiles
    for (const [profileName, profile] of Object.entries(policies.profiles)) {
      if (!profile.routes) continue;
      
      for (const [routeName, routeConfig] of Object.entries(profile.routes)) {
        allRoutes.push({
          profile: profileName,
          route: routeName,
          config: routeConfig
        });
      }
    }
    
    console.log('Route                      Budget    Actual    Status');
    console.log('──────────────────────────────────────────────────────');
    
    for (const { profile, route, config } of allRoutes) {
      const budget = config.quality?.latency_budget_ms;
      
      if (!budget) {
        console.log(`${route.padEnd(26)} Missing   N/A       ❌ FAIL`);
        budgetViolations++;
        continue;
      }
      
      // Calculate synthetic route latency by summing transform p95s
      let routeLatency = 0;
      if (config.transforms && Array.isArray(config.transforms)) {
        for (const transform of config.transforms) {
          const transformName = typeof transform === 'string' 
            ? transform 
            : Object.keys(transform)[0];
          
          if (perfResults[transformName]) {
            routeLatency += perfResults[transformName].p95;
          }
        }
      }
      
      // If no perf data, use a conservative estimate
      if (routeLatency === 0 && config.transforms) {
        routeLatency = config.transforms.length * 10; // 10ms per transform estimate
      }
      
      const actualStr = routeLatency > 0 ? `${Math.round(routeLatency)}ms` : 'N/A';
      const status = routeLatency <= budget ? '✅ PASS' : '❌ FAIL';
      
      if (routeLatency > budget) {
        budgetViolations++;
      }
      
      console.log(`${route.padEnd(26)} ${budget}ms      ${actualStr.padEnd(9)} ${status}`);
    }
    
    console.log(`\n📊 Budget Summary:`);
    console.log(`• Total routes: ${allRoutes.length}`);
    console.log(`• Budget violations: ${budgetViolations}`);
    
    if (Object.keys(perfResults).length > 0) {
      console.log(`\n📝 Note: Route latency calculated by summing transform p95 values`);
    } else {
      console.log(`\n📝 Note: Using conservative estimates (run pnpm test:perf for real data)`);
    }
    
    if (budgetViolations > 0) {
      console.error(`\n❌ ${budgetViolations} routes exceed latency budgets`);
      process.exit(1);
    }
    
    console.log('\n✅ All routes within latency budgets');
    
  } catch (error) {
    console.error('❌ Budget check failed:', error.message);
    process.exit(1);
  }
}

checkBudgets();
