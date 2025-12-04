#!/usr/bin/env node
// ClaimLens Documentation Validator
// Ensures transforms have corresponding tests and documentation

import { readdir, access } from 'fs/promises';
import { join } from 'path';

async function checkDocs() {
    console.log('📚 Checking documentation completeness...\n');
    
    try {
        // Get all transform files
        const transformFiles = await readdir('packages/transforms');
        const transforms = transformFiles.filter(f => f.endsWith('.ts') && !f.includes('.spec.'));
        
        let missingTests = 0;
        let missingDocs = 0;
        
        console.log('Transform                Test File    README Mention');
        console.log('─────────────────────────────────────────────────────');
        
        for (const transform of transforms) {
            const baseName = transform.replace('.ts', '');
            const testFile = `packages/transforms/__tests__/${baseName}.spec.ts`;
            
            // Check for test file
            let hasTest = false;
            try {
                await access(testFile);
                hasTest = true;
            } catch {
                missingTests++;
            }
            
            // Check for README mention (simplified check)
            let hasReadmeMention = false;
            try {
                const readmeContent = await readFile('README.md', 'utf-8');
                hasReadmeMention = readmeContent.includes(baseName);
            } catch {
                // README check failed
            }
            
            if (!hasReadmeMention) {
                missingDocs++;
            }
            
            const testStatus = hasTest ? '✅ Found' : '❌ Missing';
            const docStatus = hasReadmeMention ? '✅ Found' : '❌ Missing';
            
            console.log(`${baseName.padEnd(24)} ${testStatus.padEnd(12)} ${docStatus}`);
        }
        
        console.log(`\n📊 Documentation Summary:`);
        console.log(`• Total transforms: ${transforms.length}`);
        console.log(`• Missing tests: ${missingTests}`);
        console.log(`• Missing README mentions: ${missingDocs}`);
        
        if (missingTests > 0 || missingDocs > 0) {
            console.error(`\n❌ Documentation incomplete`);
            process.exit(1);
        }
        
        console.log('\n✅ All transforms properly documented');
        
    } catch (error) {
        console.error('❌ Documentation check failed:', error.message);
        process.exit(1);
    }
}

async function readFile(path, encoding) {
    const fs = await import('fs/promises');
    return fs.readFile(path, encoding);
}

checkDocs();