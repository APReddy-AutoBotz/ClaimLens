/**
 * ClaimLens Disclaimer Rewriter
 * Appends locale-aware disclaimers when banned claims are detected
 * Classifies claims into categories and maps to regulator templates
 */
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
let bannedClaimsCache = null;
/**
 * Load banned claims from packs/banned.claims.in.yaml
 */
function loadBannedClaims() {
    if (bannedClaimsCache) {
        return bannedClaimsCache;
    }
    try {
        const packPath = join(process.cwd(), 'packs', 'banned.claims.in.yaml');
        const content = readFileSync(packPath, 'utf-8');
        bannedClaimsCache = parse(content);
        return bannedClaimsCache;
    }
    catch (error) {
        console.warn('Failed to load banned claims:', error);
        return [];
    }
}
/**
 * Classify claim into category based on keywords
 * @param claim - Detected claim phrase
 * @returns Claim category
 */
function classifyClaim(claim) {
    const healthKeywords = ['cure', 'cures', 'healing', 'immunity', 'doctor', 'clinically', 'anti-aging'];
    const nutritionKeywords = ['superfood', 'no sugar', 'zero', 'pure', 'fat-burning'];
    const lowerClaim = claim.toLowerCase();
    if (healthKeywords.some(kw => lowerClaim.includes(kw))) {
        return 'health';
    }
    else if (nutritionKeywords.some(kw => lowerClaim.includes(kw))) {
        return 'nutrition';
    }
    else {
        return 'marketing';
    }
}
/**
 * Get locale-appropriate disclaimer text for claim category
 * @param category - Claim category
 * @param locale - Target locale
 * @returns Disclaimer text
 */
function getDisclaimer(category, locale) {
    const disclaimers = {
        'en-IN': {
            health: 'This claim has not been evaluated by FSSAI. This product is not intended to diagnose, treat, cure or prevent any disease.',
            nutrition: 'Nutritional claims are based on standard serving sizes. This claim has not been evaluated by FSSAI.',
            marketing: 'This is a marketing claim. Actual results may vary. Not evaluated by FSSAI.'
        },
        'en-US': {
            health: 'This statement has not been evaluated by the FDA. This product is not intended to diagnose, treat, cure or prevent any disease.',
            nutrition: 'Nutritional claims are based on standard serving sizes. This statement has not been evaluated by the FDA.',
            marketing: 'This is a marketing claim. Actual results may vary. Not evaluated by the FDA.'
        },
        'en-GB': {
            health: 'This claim has not been evaluated by the FSA. This product is not intended to diagnose, treat, cure or prevent any disease.',
            nutrition: 'Nutritional claims are based on standard serving sizes. This claim has not been evaluated by the FSA.',
            marketing: 'This is a marketing claim. Actual results may vary. Not evaluated by the FSA.'
        }
    };
    return disclaimers[locale]?.[category] || disclaimers['en-IN'][category];
}
/**
 * Rewrites text by appending disclaimers for banned claims
 * @param text - Input text to analyze
 * @param locale - Target locale (default: en-IN)
 * @returns Object with modified text and append status
 */
export function rewriteDisclaimer(text, locale = 'en-IN') {
    if (!text || typeof text !== 'string') {
        return { text: text || '', appended: false };
    }
    const bannedClaims = loadBannedClaims();
    // Check for banned claims (case-insensitive)
    const lowerText = text.toLowerCase();
    const foundClaims = bannedClaims.filter(claim => lowerText.includes(claim.toLowerCase()));
    if (foundClaims.length === 0) {
        return { text, appended: false };
    }
    // Classify the first detected claim (use most severe category if multiple)
    const category = classifyClaim(foundClaims[0]);
    // Get appropriate disclaimer for category and locale
    const disclaimer = getDisclaimer(category, locale);
    // Append disclaimer in parentheses, preserving original spacing
    const modifiedText = `${text} (${disclaimer})`;
    return {
        text: modifiedText,
        appended: true,
        category,
        detectedClaims: foundClaims
    };
}
/**
 * Transform pipeline interface for disclaimer rewriting
 * @param input - Input text to analyze
 * @param context - Transform context with locale
 * @returns Transform result with disclaimer appended
 */
export function rewriteDisclaimerTransform(input, context) {
    const result = rewriteDisclaimer(input, context.locale);
    const flags = [];
    if (result.appended && result.detectedClaims) {
        flags.push({
            kind: 'warn',
            label: 'Disclaimer added',
            explanation: `Detected banned claims: ${result.detectedClaims.join(', ')}. Category: ${result.category}`,
            source: 'https://claimlens.dev/docs/disclaimers'
        });
    }
    return {
        text: result.text,
        modified: result.appended,
        flags,
        metadata: {
            category: result.category,
            detected_claims: result.detectedClaims
        }
    };
}
