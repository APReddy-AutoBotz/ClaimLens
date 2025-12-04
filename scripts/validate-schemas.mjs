#!/usr/bin/env node
// ClaimLens Schema Validator
// Validates policies.yaml and rule packs against JSON schemas

import { readFile } from 'fs/promises';
import YAML from 'yaml';

/**
 * Simple JSON Schema validator (subset implementation)
 * Validates required fields, types, and basic constraints
 */
function validateSchema(data, schema, path = 'root') {
  const errors = [];

  // Check required fields
  if (schema.required && typeof data === 'object' && data !== null) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`${path}: Missing required field '${field}'`);
      }
    }
  }

  // Check type
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    // Treat 'integer' as 'number' for JavaScript
    const expectedType = schema.type === 'integer' ? 'number' : schema.type;
    if (actualType !== expectedType) {
      errors.push(`${path}: Expected type '${schema.type}', got '${actualType}'`);
      return errors; // Stop validation if type is wrong
    }
  }

  // Validate object properties
  if (schema.type === 'object' && schema.properties) {
    for (const [key, value] of Object.entries(data)) {
      if (schema.properties[key]) {
        errors.push(...validateSchema(value, schema.properties[key], `${path}.${key}`));
      }
    }
  }

  // Validate pattern properties
  if (schema.type === 'object' && schema.patternProperties) {
    for (const [key, value] of Object.entries(data)) {
      for (const [pattern, propSchema] of Object.entries(schema.patternProperties)) {
        if (new RegExp(pattern).test(key)) {
          errors.push(...validateSchema(value, propSchema, `${path}.${key}`));
        }
      }
    }
  }

  // Validate array items
  if (schema.type === 'array' && schema.items && Array.isArray(data)) {
    if (schema.minItems && data.length < schema.minItems) {
      errors.push(`${path}: Array must have at least ${schema.minItems} items`);
    }
    
    data.forEach((item, index) => {
      errors.push(...validateSchema(item, schema.items, `${path}[${index}]`));
    });
  }

  // Validate string patterns
  if (schema.type === 'string' && schema.pattern && typeof data === 'string') {
    if (!new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: String '${data}' does not match pattern '${schema.pattern}'`);
    }
  }

  // Validate string length
  if (schema.type === 'string' && typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      errors.push(`${path}: String must be at least ${schema.minLength} characters`);
    }
  }

  // Validate integer constraints
  if (schema.type === 'integer' && typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${path}: Value ${data} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${path}: Value ${data} is greater than maximum ${schema.maximum}`);
    }
  }

  // Validate oneOf (for rule packs)
  if (schema.oneOf) {
    let validCount = 0;
    for (const subSchema of schema.oneOf) {
      const subErrors = validateSchema(data, subSchema, path);
      if (subErrors.length === 0) {
        validCount++;
      }
    }
    if (validCount === 0) {
      errors.push(`${path}: Data does not match any of the allowed schemas`);
    }
  }

  return errors;
}

async function validatePolicies() {
  console.log('📋 Validating policies.yaml...');
  
  try {
    const policyContent = await readFile('.kiro/specs/policies.yaml', 'utf-8');
    const policyData = YAML.parse(policyContent);
    
    const schemaContent = await readFile('.kiro/specs/schemas/policy-schema.json', 'utf-8');
    const schema = JSON.parse(schemaContent);
    
    const errors = validateSchema(policyData, schema);
    
    if (errors.length > 0) {
      console.error('❌ Policy validation failed:');
      errors.forEach(err => console.error(`  • ${err}`));
      return false;
    }
    
    console.log('✅ policies.yaml is valid');
    return true;
  } catch (error) {
    console.error('❌ Failed to validate policies:', error.message);
    return false;
  }
}

async function validateRulePacks() {
  console.log('\n📋 Validating rule packs...');
  
  const packs = [
    'packs/allergens.in.yaml',
    'packs/banned.claims.in.yaml'
  ];
  
  let allValid = true;
  
  for (const packPath of packs) {
    try {
      const packContent = await readFile(packPath, 'utf-8');
      const packData = YAML.parse(packContent);
      
      const schemaContent = await readFile('.kiro/specs/schemas/rule-pack-schema.json', 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      const errors = validateSchema(packData, schema);
      
      if (errors.length > 0) {
        console.error(`❌ ${packPath} validation failed:`);
        errors.forEach(err => console.error(`  • ${err}`));
        allValid = false;
      } else {
        console.log(`✅ ${packPath} is valid`);
      }
    } catch (error) {
      console.error(`❌ Failed to validate ${packPath}:`, error.message);
      allValid = false;
    }
  }
  
  return allValid;
}

async function main() {
  console.log('🔍 ClaimLens Schema Validation\n');
  
  const policiesValid = await validatePolicies();
  const packsValid = await validateRulePacks();
  
  if (policiesValid && packsValid) {
    console.log('\n✅ All schemas valid');
    process.exit(0);
  } else {
    console.error('\n❌ Schema validation failed');
    process.exit(1);
  }
}

main();
