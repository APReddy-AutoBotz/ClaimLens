import type { ScanStep } from '../components/SpectralScan';
import type { ScanResult } from '../types';

/**
 * Generate scan steps from scan result
 */
export function generateScanSteps(
  method: 'url' | 'screenshot' | 'barcode' | 'text',
  result: ScanResult
): ScanStep[] {
  const steps: ScanStep[] = [];

  // Step 1: OCR (only for screenshots)
  if (method === 'screenshot') {
    steps.push({
      id: 'ocr',
      label: 'OCR Label Extraction (MCP)',
      status: 'clear',
      evidence: result.product_info?.scanned_text_preview 
        ? `Extracted: "${result.product_info.scanned_text_preview.substring(0, 50)}..."`
        : 'Text extracted successfully',
    });
  }

  // Step 2: Allergen detection
  const allergenBadges = result.badges.filter(b => 
    b.label.toLowerCase().includes('allergen')
  );
  steps.push({
    id: 'allergens',
    label: 'Allergen Detection',
    status: allergenBadges.length > 0 ? 'found' : 'clear',
    evidence: allergenBadges.length > 0
      ? `Found: ${allergenBadges.map(b => b.explanation).join(', ')}`
      : 'No allergens detected',
  });

  // Step 3: Banned claims
  const bannedClaimBadges = result.badges.filter(b => 
    b.label.toLowerCase().includes('banned') || b.label.toLowerCase().includes('claim')
  );
  const bannedClaimReasons = result.reasons.filter(r =>
    r.transform.includes('banned') || r.transform.includes('claim')
  );
  const hasBannedClaims = bannedClaimBadges.length > 0 || bannedClaimReasons.length > 0;
  
  steps.push({
    id: 'banned_claims',
    label: 'Banned Claims Check',
    status: hasBannedClaims ? 'found' : 'clear',
    evidence: hasBannedClaims
      ? bannedClaimBadges[0]?.explanation || bannedClaimReasons[0]?.why || 'Prohibited health claim detected'
      : 'No banned claims found',
  });

  // Step 4: Disclaimer verification
  const disclaimerReasons = result.reasons.filter(r =>
    r.transform.includes('disclaimer') || r.transform.includes('rewrite')
  );
  steps.push({
    id: 'disclaimers',
    label: 'Disclaimer Verification',
    status: disclaimerReasons.length > 0 ? 'found' : 'clear',
    evidence: disclaimerReasons.length > 0
      ? 'Missing required disclaimers'
      : 'All disclaimers present',
  });

  // Step 5: PII redaction
  const piiReasons = result.reasons.filter(r =>
    r.transform.includes('pii') || r.transform.includes('redact')
  );
  steps.push({
    id: 'pii',
    label: 'PII Redaction',
    status: piiReasons.length > 0 ? 'found' : 'clear',
    evidence: piiReasons.length > 0
      ? 'Personal information detected and redacted'
      : 'No PII detected',
  });

  // Step 6: Recall lookup (MCP)
  const recallBadges = result.badges.filter(b => 
    b.label.toLowerCase().includes('recall')
  );
  steps.push({
    id: 'recalls',
    label: 'Recall Database Lookup (MCP)',
    status: recallBadges.length > 0 ? 'found' : 'clear',
    evidence: recallBadges.length > 0
      ? 'Product recall found'
      : 'No recalls found',
  });

  // Step 7: Weasel words
  const weaselBadges = result.badges.filter(b => 
    b.label.toLowerCase().includes('weasel')
  );
  if (weaselBadges.length > 0) {
    steps.push({
      id: 'weasel',
      label: 'Marketing Language Analysis',
      status: 'found',
      evidence: weaselBadges[0]?.explanation || 'Vague marketing language detected',
    });
  }

  return steps;
}
