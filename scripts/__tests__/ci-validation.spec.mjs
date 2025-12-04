#!/usr/bin/env node
// ClaimLens CI/CD Validation Tests
// Tests for schema validation, signature verification, and CI gates

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { execSync } from 'child_process';
import YAML from 'yaml';

describe('CI/CD Validation Tests', () => {
  describe('Schema Validation', () => {
    it('should validate valid policies.yaml', async () => {
      const result = execSync('node scripts/validate-schemas.mjs', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('policies.yaml is valid');
      expect(result).toContain('All schemas valid');
    });

    it('should catch invalid policy structure', async () => {
      // Backup original
      const original = await readFile('.kiro/specs/policies.yaml', 'utf-8');
      
      try {
        // Create invalid policy (missing version)
        const invalidPolicy = {
          profiles: {
            test: {
              name: 'Test',
              routes: []
            }
          }
        };
        
        await writeFile('.kiro/specs/policies.yaml', YAML.stringify(invalidPolicy));
        
        // Should fail validation
        expect(() => {
          execSync('node scripts/validate-schemas.mjs', { 
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        }).toThrow();
        
      } finally {
        // Restore original
        await writeFile('.kiro/specs/policies.yaml', original);
      }
    });

    it('should validate rule packs', async () => {
      const result = execSync('node scripts/validate-schemas.mjs', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('allergens.in.yaml is valid');
      expect(result).toContain('banned.claims.in.yaml is valid');
    });
  });

  describe('Signature Verification', () => {
    it('should generate signatures for rule packs', async () => {
      const result = execSync('node scripts/verify-signatures.mjs --generate', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Generated');
      expect(result).toContain('Signatures saved');
      
      // Verify signatures file exists
      const signatures = await readFile('packs/.signatures.json', 'utf-8');
      const data = JSON.parse(signatures);
      
      expect(data).toHaveProperty('packs/allergens.in.yaml');
      expect(data).toHaveProperty('packs/banned.claims.in.yaml');
    });

    it('should verify valid signatures', async () => {
      // First generate signatures
      execSync('node scripts/verify-signatures.mjs --generate', { stdio: 'pipe' });
      
      // Then verify
      const result = execSync('node scripts/verify-signatures.mjs', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Valid');
      expect(result).toContain('All rule pack signatures valid');
    });

    it('should detect tampered rule packs', async () => {
      // Generate signatures
      execSync('node scripts/verify-signatures.mjs --generate', { stdio: 'pipe' });
      
      // Backup original
      const original = await readFile('packs/allergens.in.yaml', 'utf-8');
      
      try {
        // Tamper with file
        await writeFile('packs/allergens.in.yaml', original + '\n- tampered');
        
        // Should fail verification
        expect(() => {
          execSync('node scripts/verify-signatures.mjs', { 
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        }).toThrow();
        
      } finally {
        // Restore original
        await writeFile('packs/allergens.in.yaml', original);
      }
    });
  });

  describe('Latency Budget Enforcement', () => {
    beforeAll(async () => {
      // Ensure performance results exist
      await mkdir('dist', { recursive: true });
      const perfResults = {
        'rewrite.disclaimer': { p50: 2.5, p95: 5.0, samples: 5 },
        'redact.pii': { p50: 1.8, p95: 3.5, samples: 5 },
        'detect.allergens': { p50: 3.2, p95: 6.0, samples: 5 }
      };
      await writeFile('dist/perf-results.json', JSON.stringify(perfResults, null, 2));
    });

    it('should pass when routes are within budget', async () => {
      const result = execSync('pnpm check:budgets', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Checking latency budgets');
      expect(result).toContain('Budget Summary');
    });

    it('should fail when routes exceed budget', async () => {
      // Backup original policy
      const original = await readFile('.kiro/specs/policies.yaml', 'utf-8');
      
      try {
        // Create policy with impossible budget
        const policy = YAML.parse(original);
        policy.profiles.menushield_in.routes[0].latency_budget_ms = 1; // 1ms is impossible
        
        await writeFile('.kiro/specs/policies.yaml', YAML.stringify(policy));
        
        // Should fail budget check
        expect(() => {
          execSync('pnpm check:budgets', { 
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        }).toThrow();
        
      } finally {
        // Restore original
        await writeFile('.kiro/specs/policies.yaml', original);
      }
    });
  });

  describe('Fixture Regression', () => {
    it('should run fixture tests', async () => {
      const result = execSync('pnpm test:fixtures', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Fixture Summary');
      expect(result).toContain('Menu fixtures');
      expect(result).toContain('Site fixtures');
    });
  });

  describe('Documentation Completeness', () => {
    it('should verify transforms have tests and documentation', async () => {
      const result = execSync('pnpm check:docs-for-new-transforms', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      expect(result).toContain('Checking documentation completeness');
      expect(result).toContain('Documentation Summary');
    });
  });

  describe('CI Gates Integration', () => {
    it('should run all CI gates successfully', async () => {
      // This is a comprehensive test that may take longer
      const result = execSync('node scripts/ci-gates.mjs', { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });
      
      expect(result).toContain('CI Pipeline Gates');
      expect(result).toContain('Schema Validation');
      expect(result).toContain('Signature Verification');
      expect(result).toContain('CI Gates Summary');
    });
  });
});
