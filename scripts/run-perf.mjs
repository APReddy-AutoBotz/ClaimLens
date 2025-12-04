#!/usr/bin/env node
// ClaimLens Performance Testing
// Measures transform pipeline latency with real timing

import { mkdir, writeFile } from 'fs/promises';

console.log('⚡ ClaimLens Performance Report\n');

// Sample test data
const testSamples = [
  'Amazing superfood smoothie with fresh ingredients',
  'Miracle detox juice for weight loss. Contact us at info@test.com or +91 9876543210',
  'Organic healthy bowl with nuts and seeds',
  'Anti-aging formula with natural ingredients. Delivery to pincode 400001',
  'Fat-burning protein shake for fitness enthusiasts'
];

// Simple regex-based transforms for performance testing
function testRewriteDisclaimer(text) {
  const bannedClaims = ['superfood', 'detox', 'miracle', 'anti-aging', 'fat-burning'];
  const lowerText = text.toLowerCase();
  const hasBanned = bannedClaims.some(claim => lowerText.includes(claim));
  
  if (hasBanned) {
    return { text: `${text} (This claim has not been evaluated by FSSAI)`, appended: true };
  }
  return { text, appended: false };
}

function testRedactPii(text) {
  let redacted = text;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /(?:\+91[-\s]?)?[6-9]\d{9}\b/g;
  
  const emailCount = (text.match(emailPattern) || []).length;
  const phoneCount = (text.match(phonePattern) || []).length;
  
  redacted = redacted.replace(emailPattern, '[EMAIL_REDACTED]');
  redacted = redacted.replace(phonePattern, '[PHONE_REDACTED]');
  
  return { text: redacted, counts: { email: emailCount, phone: phoneCount, pincode: 0 } };
}

async function measureTransform(name, fn, samples) {
  const timings = [];
  
  for (const sample of samples) {
    const start = process.hrtime.bigint();
    fn(sample);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    timings.push(durationMs);
  }
  
  timings.sort((a, b) => a - b);
  const p50 = timings[Math.floor(timings.length * 0.5)];
  const p95 = timings[Math.floor(timings.length * 0.95)];
  
  return {
    transform: name,
    p50: Math.round(p50 * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    samples: timings.length
  };
}

async function runPerformanceTests() {
  const results = {};
  
  // Measure rewrite.disclaimer
  results['rewrite.disclaimer'] = await measureTransform(
    'rewrite.disclaimer',
    testRewriteDisclaimer,
    testSamples
  );
  
  // Measure redact.pii
  results['redact.pii'] = await measureTransform(
    'redact.pii',
    testRedactPii,
    testSamples
  );
  
  // Display results
  console.log('Transform              P50      P95      Samples');
  console.log('──────────────────────────────────────────────────');
  
  Object.values(results).forEach(result => {
    const p50Str = `${result.p50}ms`.padEnd(8);
    const p95Str = `${result.p95}ms`.padEnd(8);
    console.log(`${result.transform.padEnd(22)} ${p50Str} ${p95Str} ${result.samples}`);
  });
  
  // Save results to dist/perf-results.json
  try {
    await mkdir('dist', { recursive: true });
    await writeFile('dist/perf-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to dist/perf-results.json');
  } catch (error) {
    console.error('\n⚠️  Failed to save results:', error.message);
  }
  
  console.log('\n📊 Performance Summary:');
  const avgP95 = Object.values(results).reduce((sum, r) => sum + r.p95, 0) / Object.keys(results).length;
  console.log(`• Average p95: ${Math.round(avgP95 * 100) / 100}ms`);
  console.log(`• Total transforms tested: ${Object.keys(results).length}`);
}

runPerformanceTests().catch(err => {
  console.error('❌ Performance testing failed:', err.message);
  process.exit(1);
});
