/**
 * Augment-Lite Governance Gate
 * Validates policy changes with 4C fields and risk-based autonomy caps
 */
export const RISK_PROFILES = {
    reorder_transforms: {
        action: 'Reorder transforms in pipeline',
        riskLevel: 'high',
        maxAutonomy: 2,
        requiresApproval: true,
    },
    change_threshold: {
        action: 'Modify nutrition thresholds',
        riskLevel: 'medium',
        maxAutonomy: 3,
        requiresApproval: false,
    },
    edit_rule_pack: {
        action: 'Edit rule pack content',
        riskLevel: 'medium',
        maxAutonomy: 3,
        requiresApproval: false,
    },
    add_transform: {
        action: 'Add new transform to pipeline',
        riskLevel: 'high',
        maxAutonomy: 2,
        requiresApproval: true,
    },
    remove_transform: {
        action: 'Remove transform from pipeline',
        riskLevel: 'high',
        maxAutonomy: 2,
        requiresApproval: true,
    },
    change_latency_budget: {
        action: 'Modify latency budget',
        riskLevel: 'medium',
        maxAutonomy: 3,
        requiresApproval: false,
    },
};
// ============================================================================
// Augment-Lite Gate
// ============================================================================
export class AugmentLiteGate {
    riskProfiles;
    constructor(customProfiles) {
        this.riskProfiles = { ...RISK_PROFILES, ...customProfiles };
    }
    /**
     * Get risk profile for an action
     */
    getRiskProfile(action) {
        return this.riskProfiles[action] || null;
    }
    /**
     * Validate policy edit with 4C fields and autonomy level
     */
    validateEdit(action, fields, autonomy) {
        const profile = this.getRiskProfile(action);
        if (!profile) {
            return {
                valid: false,
                error: `Unknown action: ${action}`,
            };
        }
        // Validate context field
        if (!fields.context || fields.context.trim().length < 20) {
            return {
                valid: false,
                error: 'Context must be at least 20 characters',
            };
        }
        // Validate constraints field
        if (!fields.constraints || fields.constraints.trim().length < 20) {
            return {
                valid: false,
                error: 'Constraints must be at least 20 characters',
            };
        }
        // Validate self-critique field
        if (!fields.selfCritique || fields.selfCritique.trim().length < 20) {
            return {
                valid: false,
                error: 'Self-critique must be at least 20 characters',
            };
        }
        // Validate confirmation
        if (!fields.confirm) {
            return {
                valid: false,
                error: 'You must confirm understanding of risks',
            };
        }
        // Validate autonomy slider
        if (autonomy < 0 || autonomy > 5) {
            return {
                valid: false,
                error: 'Autonomy level must be between 0 and 5',
            };
        }
        if (autonomy > profile.maxAutonomy) {
            return {
                valid: false,
                error: `Autonomy level ${autonomy} exceeds maximum ${profile.maxAutonomy} for ${profile.riskLevel} risk actions`,
            };
        }
        // Generate warnings for high-risk actions
        const warnings = [];
        if (profile.requiresApproval) {
            warnings.push('This change requires Admin approval before it can be applied');
        }
        if (profile.riskLevel === 'high') {
            warnings.push('High-risk change detected. Please test thoroughly with fixtures before deploying');
        }
        return {
            valid: true,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    /**
     * Check if action requires approval workflow
     */
    requiresApproval(action) {
        const profile = this.getRiskProfile(action);
        return profile?.requiresApproval || false;
    }
    /**
     * Get maximum autonomy level for action
     */
    getMaxAutonomy(action) {
        const profile = this.getRiskProfile(action);
        return profile?.maxAutonomy || 0;
    }
    /**
     * Get risk level for action
     */
    getRiskLevel(action) {
        const profile = this.getRiskProfile(action);
        return profile?.riskLevel || null;
    }
    /**
     * Validate multiple fields at once
     */
    validateFields(fields) {
        const errors = [];
        if (!fields.context || fields.context.trim().length < 20) {
            errors.push('Context must be at least 20 characters');
        }
        if (!fields.constraints || fields.constraints.trim().length < 20) {
            errors.push('Constraints must be at least 20 characters');
        }
        if (!fields.selfCritique || fields.selfCritique.trim().length < 20) {
            errors.push('Self-critique must be at least 20 characters');
        }
        if (!fields.confirm) {
            errors.push('You must confirm understanding of risks');
        }
        if (errors.length > 0) {
            return {
                valid: false,
                error: errors.join('; '),
            };
        }
        return { valid: true };
    }
}
