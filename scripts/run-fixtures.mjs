#!/usr/bin/env node
// ClaimLens Fixture Runner
// Lists fixture counts and validates structure

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function countFixtures() {
    console.log('🧪 ClaimLens Fixture Summary\n');
    
    try {
        // Count menu fixtures
        const menuFiles = await readdir('fixtures/menu');
        const menuCount = menuFiles.filter(f => f.endsWith('.json')).length;
        console.log(`📋 Menu fixtures: ${menuCount} files`);
        
        // Count site fixtures  
        const siteFiles = await readdir('fixtures/sites');
        const siteCount = siteFiles.filter(f => f.endsWith('.html')).length;
        console.log(`🌐 Site fixtures: ${siteCount} files`);
        
        // Sample a menu fixture for validation
        if (menuCount > 0) {
            const sampleMenu = menuFiles.find(f => f.endsWith('.json'));
            const menuContent = await readFile(join('fixtures/menu', sampleMenu), 'utf-8');
            const menuData = JSON.parse(menuContent);
            
            if (menuData.items && Array.isArray(menuData.items)) {
                console.log(`✓ Sample menu structure valid (${menuData.items.length} items)`);
            } else {
                console.log('⚠️  Sample menu missing items array');
            }
        }
        
        console.log('\n📝 TODO: Execute transform chains against fixtures');
        console.log('📝 TODO: Validate fixture outputs match expected results');
        console.log('📝 TODO: Performance benchmarking with fixture data');
        
    } catch (error) {
        console.error('❌ Fixture validation failed:', error.message);
        process.exit(1);
    }
}

countFixtures();