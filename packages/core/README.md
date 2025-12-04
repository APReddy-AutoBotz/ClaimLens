# ClaimLens Core Package

Core types, interfaces, and utilities for the ClaimLens system.

## Overview

This package provides the foundational building blocks for the ClaimLens transform pipeline:

- **Type Definitions**: MenuItem, Verdict, Transform interfaces
- **Normalization**: MenuItem ingredient normalization utilities
- **Pipeline Engine**: Transform orchestration and execution
- **Policy Loader**: YAML policy parsing with versioning and caching

## Installation

```bash
npm install
```

## Usage

### MenuItem Normalization

```typescript
import { normalizeMenuItem, normalizeIngredients } from '@claimlens/core';

// Normalize a menu item
const item = {
  id: '1',
  name: 'Chocolate Cake',
  ingredients: 'flour, sugar, cocoa' // String format
};

const normalized = normalizeMenuItem(item);
// normalized.ingredients === ['flour', 'sugar', 'cocoa']

// Or normalize ingredients directly
const ingredients = normalizeIngredients('flour; sugar; eggs');
// ['flour', 'sugar', 'eggs']
```

### Transform Pipeline

```typescript
import { TransformPipeline, PolicyLoader } from '@claimlens/core';

// Create pipeline
const pipeline = new TransformPipeline();

// Load policy
const loader = new PolicyLoader({
  policyPath: '.kiro/specs/policies.yaml',
  rulePacksDir: 'packs/'
});
const policy = loader.loadPolicy();
pipeline.loadPolicy(policy);

// Register transforms
pipeline.registerTransform('redact.pii', (input, context) => ({
  text: input.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]'),
  modified: true,
  flags: []
}));

// Execute pipeline
const item = {
  id: '1',
  name: 'Test',
  description: 'Contact us at test@example.com',
  ingredients: []
};

const verdict = await pipeline.execute(item, 'menushield_in', {
  locale: 'en-IN',
  tenant: 'test-tenant',
  correlationId: 'req-123'
});

console.log(verdict.verdict); // 'modify'
console.log(verdict.changes); // [{ field: 'description', before: '...', after: '...' }]
```

### Policy Loader

```typescript
import { PolicyLoader } from '@claimlens/core';

const loader = new PolicyLoader({
  policyPath: '.kiro/specs/policies.yaml',
  rulePacksDir: 'packs/',
  cacheTTL: 300000, // 5 minutes
  verifySignatures: false
});

// Load policy
const policy = loader.loadPolicy();
console.log(policy.version); // '1.0.0'
console.log(policy.profiles); // { menushield_in: {...}, claimlens_go: {...} }

// Load rule pack
const rulePack = loader.loadRulePack('allergens.in.yaml');
console.log(rulePack.version);
console.log(rulePack.signature); // SHA-256 hash

// Reload policy (bypass cache)
const fresh = loader.reloadPolicy();
```

## API Reference

### Types

- `MenuItem` - Menu item with optional ingredients (string | string[])
- `NormalizedMenuItem` - Menu item with normalized ingredients (string[])
- `Verdict` - Transform pipeline result (allow | modify | block)
- `TransformFunction` - Transform function signature
- `TransformContext` - Context passed to transforms
- `TransformResult` - Transform execution result
- `Policy` - Policy configuration with profiles and routes
- `RulePack` - Versioned rule pack with signature

### Functions

- `normalizeIngredients(input)` - Normalize ingredients to array
- `normalizeMenuItem(item)` - Normalize entire menu item

### Classes

- `TransformPipeline` - Orchestrates transform execution
- `TransformRegistry` - Manages registered transforms
- `PolicyLoader` - Loads and validates policies
- `PolicyCache` - Caches policies with TTL

## Testing

```bash
npm test -- packages/core/__tests__/
```

All core functionality is tested with 39 unit tests covering:
- Ingredient normalization (14 tests)
- Pipeline execution (11 tests)
- Policy loading and validation (14 tests)

## Requirements

Implements requirements:
- 1.1: Content Analysis and Validation
- 1.4: Audit Trail Generation
- 5.1: Performance Monitoring
- 20.1-20.7: Policy DSL Governance

## License

Proprietary - ClaimLens System
