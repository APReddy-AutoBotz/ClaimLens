#!/usr/bin/env node
// ClaimLens MCP Development Server Launcher
// Boots all four MCP mock services

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const services = [
  { name: 'OCR Label', script: 'ocr-label.mjs', port: 7001 },
  { name: 'Unit Convert', script: 'unit-convert.mjs', port: 7002 },
  { name: 'Recall Lookup', script: 'recall-lookup.mjs', port: 7003 },
  { name: 'Alt Suggester', script: 'alt-suggester.mjs', port: 7004 }
];

console.log('🚀 Starting ClaimLens MCP Development Services...\n');

const processes = [];

services.forEach(service => {
  const scriptPath = join(__dirname, service.script);
  const proc = spawn('node', [scriptPath], {
    stdio: 'inherit',
    shell: true
  });
  
  proc.on('error', (err) => {
    console.error(`❌ Failed to start ${service.name}:`, err.message);
  });
  
  processes.push({ name: service.name, proc });
});

console.log('\n📋 Services starting:');
services.forEach(s => console.log(`  • ${s.name} → http://localhost:${s.port}`));
console.log('\nPress Ctrl+C to stop all services\n');

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all services...');
  processes.forEach(({ name, proc }) => {
    proc.kill();
    console.log(`  ✓ Stopped ${name}`);
  });
  process.exit(0);
});
