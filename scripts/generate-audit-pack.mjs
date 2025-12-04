#!/usr/bin/env node
// ClaimLens Audit Pack Generator
// Creates audit reports from menu analysis results

import { readFile, mkdir, writeFile } from 'fs/promises';

// Simple transform implementations for audit generation
function rewriteDisclaimer(text) {
  const bannedClaims = ['superfood', 'detox', 'miracle', 'anti-aging', 'fat-burning', 'immunity booster', 'doctor recommended', 'clinically proven', '100% pure', 'no sugar added'];
  const lowerText = text.toLowerCase();
  const hasBanned = bannedClaims.some(claim => lowerText.includes(claim));
  
  if (hasBanned) {
    return { text: `${text} (This claim has not been evaluated by FSSAI)`, appended: true };
  }
  return { text, appended: false };
}

function redactPii(text) {
  if (!text) return { text: '', counts: { email: 0, phone: 0, pincode: 0 } };
  
  let redacted = text;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /(?:\+91[-\s]?)?[6-9]\d{9}\b/g;
  const pincodePattern = /\b(?:pin\s*code?|postal\s*code|zip\s*code)[\s:]*(\d{6})\b/gi;
  
  const emailCount = (text.match(emailPattern) || []).length;
  const phoneCount = (text.match(phonePattern) || []).length;
  const pincodeCount = (text.match(pincodePattern) || []).length;
  
  redacted = redacted.replace(emailPattern, '[EMAIL_REDACTED]');
  redacted = redacted.replace(phonePattern, '[PHONE_REDACTED]');
  redacted = redacted.replace(pincodePattern, (match) => match.replace(/\d{6}/, '[PINCODE_REDACTED]'));
  
  return { text: redacted, counts: { email: emailCount, phone: phoneCount, pincode: pincodeCount } };
}

async function generateAuditPack(menuPath) {
  console.log('📋 Generating audit pack...\n');
  
  try {
    // Read menu fixture
    const menuContent = await readFile(menuPath, 'utf-8');
    const menu = JSON.parse(menuContent);
    
    if (!menu.items || !Array.isArray(menu.items)) {
      throw new Error('Invalid menu format: missing items array');
    }
    
    const auditId = `audit-${Date.now()}`;
    const results = [];
    const summary = {
      total_items: menu.items.length,
      flagged_items: 0,
      flags: {
        banned_claims: 0,
        pii_detected: 0,
        allergens: 0
      }
    };
    
    // Process each menu item
    for (const item of menu.items) {
      const itemResult = {
        id: item.id,
        name: item.name,
        before: {
          name: item.name,
          description: item.description
        },
        after: {},
        flags: [],
        transforms_applied: []
      };
      
      // Apply disclaimer rewrite
      const disclaimerResult = rewriteDisclaimer(item.name);
      itemResult.after.name = disclaimerResult.text;
      if (disclaimerResult.appended) {
        itemResult.flags.push('banned_claim');
        itemResult.transforms_applied.push('rewrite.disclaimer');
        summary.flags.banned_claims++;
      }
      
      // Apply PII redaction
      const piiResult = redactPii(item.description || '');
      itemResult.after.description = piiResult.text;
      if (piiResult.counts.email + piiResult.counts.phone + piiResult.counts.pincode > 0) {
        itemResult.flags.push('pii_detected');
        itemResult.transforms_applied.push('redact.pii');
        summary.flags.pii_detected++;
      }
      
      // Check for allergens (simplified)
      const allergens = ['peanuts', 'nuts', 'sesame', 'milk', 'lactose'];
      const ingredientsText = (item.ingredients || []).join(' ').toLowerCase();
      const foundAllergens = allergens.filter(a => ingredientsText.includes(a));
      if (foundAllergens.length > 0) {
        itemResult.flags.push('allergen');
        itemResult.allergens = foundAllergens;
        summary.flags.allergens++;
      }
      
      if (itemResult.flags.length > 0) {
        summary.flagged_items++;
      }
      
      results.push(itemResult);
    }
    
    // Create output directory
    await mkdir('dist/audit-packs', { recursive: true });
    
    // Write JSONL file
    const jsonlPath = `dist/audit-packs/${auditId}.jsonl`;
    const jsonlContent = results.map(r => JSON.stringify(r)).join('\n');
    await writeFile(jsonlPath, jsonlContent);
    
    // Write Markdown summary
    const mdPath = `dist/audit-packs/${auditId}.md`;
    const mdContent = generateMarkdownSummary(menu, summary, results);
    await writeFile(mdPath, mdContent);
    
    console.log(`✅ Audit pack generated: ${auditId}`);
    console.log(`📄 JSONL: ${jsonlPath}`);
    console.log(`📝 Summary: ${mdPath}\n`);
    
    console.log('📊 Summary:');
    console.log(`• Total items: ${summary.total_items}`);
    console.log(`• Flagged items: ${summary.flagged_items}`);
    console.log(`• Banned claims: ${summary.flags.banned_claims}`);
    console.log(`• PII detected: ${summary.flags.pii_detected}`);
    console.log(`• Allergen warnings: ${summary.flags.allergens}`);
    
  } catch (error) {
    console.error('❌ Audit pack generation failed:', error.message);
    process.exit(1);
  }
}

function generateMarkdownSummary(menu, summary, results) {
  let md = `# ClaimLens Audit Report\n\n`;
  md += `**Restaurant:** ${menu.restaurant || 'Unknown'}\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- Total items analyzed: ${summary.total_items}\n`;
  md += `- Items flagged: ${summary.flagged_items}\n`;
  md += `- Banned claims detected: ${summary.flags.banned_claims}\n`;
  md += `- PII instances: ${summary.flags.pii_detected}\n`;
  md += `- Allergen warnings: ${summary.flags.allergens}\n\n`;
  
  md += `## Flagged Items\n\n`;
  
  const flaggedItems = results.filter(r => r.flags.length > 0);
  
  if (flaggedItems.length === 0) {
    md += `No items flagged. All content compliant.\n\n`;
  } else {
    flaggedItems.forEach((item, idx) => {
      md += `### ${idx + 1}. ${item.before.name}\n\n`;
      md += `**Flags:** ${item.flags.join(', ')}\n\n`;
      
      if (item.before.name !== item.after.name) {
        md += `**Before:** ${item.before.name}\n`;
        md += `**After:** ${item.after.name}\n\n`;
      }
      
      if (item.before.description !== item.after.description) {
        md += `**Description Before:** ${item.before.description}\n`;
        md += `**Description After:** ${item.after.description}\n\n`;
      }
      
      if (item.allergens) {
        md += `**Allergens:** ${item.allergens.join(', ')}\n\n`;
      }
      
      md += `**Transforms Applied:** ${item.transforms_applied.join(', ') || 'none'}\n\n`;
      md += `---\n\n`;
    });
  }
  
  md += `## Clean Items\n\n`;
  const cleanItems = results.filter(r => r.flags.length === 0);
  md += `${cleanItems.length} items passed without flags:\n\n`;
  cleanItems.forEach(item => {
    md += `- ${item.name}\n`;
  });
  
  return md;
}

// CLI usage
const menuPath = process.argv[2] || 'fixtures/menu/edge-cases.json';
generateAuditPack(menuPath);
