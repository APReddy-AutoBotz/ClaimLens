/**
 * Trust Score Calculator for B2C Consumer Mode
 *
 * Calculates a 0-110 trust score based on detected issues:
 * - Base score: 100
 * - Banned claims: -40 per claim
 * - Recalls: -30
 * - User allergens: -20 per allergen
 * - Weasel words: -10 to -20 based on density
 * - Clean bonus: +10 if no issues
 */
/**
 * Calculate trust score based on detected issues
 * Pure function with deterministic output
 */
export function calculateTrustScore(input) {
    const baseScore = 100;
    // Calculate deductions
    const bannedClaimsDeduction = input.bannedClaimsCount * 40;
    const recallDeduction = input.hasRecall ? 30 : 0;
    const allergenDeduction = input.userAllergensCount * 20;
    // Weasel word deduction based on density
    let weaselWordDeduction = 0;
    if (input.weaselWordDensity > 0.20) {
        weaselWordDeduction = 20;
    }
    else if (input.weaselWordDensity >= 0.10) {
        weaselWordDeduction = 15;
    }
    else if (input.weaselWordDensity >= 0.05) {
        weaselWordDeduction = 10;
    }
    // Calculate if clean (no issues)
    // Weasel words below 5% density don't count as an issue
    const hasNoIssues = input.bannedClaimsCount === 0 &&
        !input.hasRecall &&
        input.userAllergensCount === 0 &&
        input.weaselWordDensity < 0.05;
    const cleanBonus = hasNoIssues ? 10 : 0;
    // Calculate final score
    const rawScore = baseScore
        - bannedClaimsDeduction
        - recallDeduction
        - allergenDeduction
        - weaselWordDeduction
        + cleanBonus;
    // Clamp to 0-110 range
    const finalScore = Math.max(0, Math.min(110, rawScore));
    return {
        score: finalScore,
        breakdown: {
            baseScore,
            bannedClaimsDeduction,
            recallDeduction,
            allergenDeduction,
            weaselWordDeduction,
            cleanBonus,
            finalScore,
        },
    };
}
/**
 * Get verdict classification based on trust score
 */
export function getVerdict(score) {
    if (score >= 80) {
        return {
            label: 'allow',
            color: '#10B981',
            icon: '✓',
            explanation: 'This product meets safety standards with minimal concerns.',
        };
    }
    if (score >= 50) {
        return {
            label: 'caution',
            color: '#F59E0B',
            icon: '⚠',
            explanation: 'This product has some concerns. Review the details before deciding.',
        };
    }
    return {
        label: 'avoid',
        color: '#EF4444',
        icon: '✕',
        explanation: 'This product has significant safety or accuracy concerns.',
    };
}
