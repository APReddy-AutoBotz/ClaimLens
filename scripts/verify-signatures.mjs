#!/usr/bin/env node
// ClaimLens Rule Pack Signature Verifier
// Verifies SHA-256 signatures for rule packs

import { readFile, writeFile, access } from 'fs/promises';
import { createHash } from 'crypto';

/**
 * Calculate SHA-256 hash of file content
 */
function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Load or create signature file
 */
async function loadSignatures() {
  try {
    const content = await readFile('packs/.signatures.json', 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist, return empty object
    return {};
  }
}

/**
 * Save signatures to file
 */
async function saveSignatures(signatures) {
  await writeFile('packs/.signatures.json', JSON.stringify(signatures, null, 2));
}

/**
 * Verify rule pack signatures
 */
async function verifySignatures(mode = 'verify') {
  console.log('🔐 ClaimLens Rule Pack Signature Verification\n');
  
  const packs = [
    'packs/allergens.in.yaml',
    'packs/banned.claims.in.yaml',
    'packs/disclaimers.in.md'
  ];
  
  const signatures = await loadSignatures();
  let allValid = true;
  let updated = false;
  
  console.log('Pack                          Status      Hash');
  console.log('─────────────────────────────────────────────────────────────────────');
  
  for (const packPath of packs) {
    try {
      const content = await readFile(packPath, 'utf-8');
      const currentHash = calculateHash(content);
      const storedHash = signatures[packPath];
      
      if (mode === 'generate') {
        // Generate mode: update signatures
        signatures[packPath] = currentHash;
        updated = true;
        console.log(`${packPath.padEnd(29)} ✅ Generated ${currentHash.substring(0, 16)}...`);
      } else {
        // Verify mode: check signatures
        if (!storedHash) {
          console.log(`${packPath.padEnd(29)} ⚠️  Missing   ${currentHash.substring(0, 16)}...`);
          allValid = false;
        } else if (storedHash !== currentHash) {
          console.log(`${packPath.padEnd(29)} ❌ Tampered  ${currentHash.substring(0, 16)}...`);
          console.log(`${''.padEnd(29)}    Expected: ${storedHash.substring(0, 16)}...`);
          allValid = false;
        } else {
          console.log(`${packPath.padEnd(29)} ✅ Valid     ${currentHash.substring(0, 16)}...`);
        }
      }
    } catch (error) {
      console.log(`${packPath.padEnd(29)} ❌ Error: ${error.message}`);
      allValid = false;
    }
  }
  
  if (mode === 'generate' && updated) {
    await saveSignatures(signatures);
    console.log('\n💾 Signatures saved to packs/.signatures.json');
    console.log('✅ Signature generation complete');
    return true;
  }
  
  if (mode === 'verify') {
    if (allValid) {
      console.log('\n✅ All rule pack signatures valid');
      return true;
    } else {
      console.error('\n❌ Signature verification failed');
      console.error('\n💡 To regenerate signatures, run: node scripts/verify-signatures.mjs --generate');
      return false;
    }
  }
  
  return allValid;
}

async function main() {
  const mode = process.argv.includes('--generate') ? 'generate' : 'verify';
  
  const valid = await verifySignatures(mode);
  process.exit(valid ? 0 : 1);
}

main();
