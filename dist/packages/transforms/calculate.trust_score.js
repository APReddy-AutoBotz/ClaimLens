/**
 * ClaimLens Trust Score Calculator Transform
 * Integrates trust score calculation into the transform pipeline
 */
import { calculateTrustScore, getVerdict } from '../core/trust-score.js';
/**
 * Transform pipeline interface for trust score calculation
 * Expects metadata from previous transforms to calculate score
 *
 * @param input - Original text (passed through unchanged)
 * @param context - Transform context with accumulated metadata
 * @returns Transform result with trust score and verdict
 */
export function calculateTrustScoreTransform(input, context) {
    // Extract counts from context metadata (accumulated from previous transforms)
    // This assumes previous transforms have set these values
    const metadata = context.metadata || {};
    const trustScoreInput = {
        bannedClaimsCount: metadata.banned_claims_count || 0,
        hasRecall: metadata.has_recall || false,
        userAllergensCount: metadata.user_allergens_count || 0,
        weaselWordDensity: metadata.weasel_word_density || 0,
    };
    const result = calculateTrustScore(trustScoreInput);
    const verdict = getVerdict(result.score);
    const flags = [];
    // Add verdict as a flag
    flags.push({
        kind: verdict.label === 'allow' ? 'ok' : verdict.label === 'caution' ? 'warn' : 'danger',
        label: `Trust Score: ${result.score}`,
        explanation: verdict.explanation,
        source: 'https://claimlens.dev/docs/trust-score',
    });
    return {
        text: input,
        modified: false,
        flags,
        metadata: {
            trust_score: result.score,
            trust_score_breakdown: result.breakdown,
            verdict: verdict.label,
            verdict_color: verdict.color,
            verdict_icon: verdict.icon,
            verdict_explanation: verdict.explanation,
        },
    };
}
