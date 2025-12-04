/**
 * Augment-Lite Governance Gate
 * Validates policy changes with 4C fields and risk-based autonomy caps
 */

// ============================================================================
// Risk Profiles
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskProfile {
  action: string;
  riskLevel: RiskLevel;
  maxAutonomy: number;
  requiresApproval: boolean;
}

export const RISK_PROFILES: Record<string, RiskProfile> = {
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
// 4C Fields Interface
// ============================================================================

export interface AugmentLiteFields {
  context: string; // What are you changing and why?
  constraints: string; // What constraints must be maintained?
  selfCritique: string; // What could go wrong?
  confirm: boolean; // I understand the risks
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// ============================================================================
// Augment-Lite Gate
// ============================================================================

export class AugmentLiteGate {
  private riskProfiles: Record<string, RiskProfile>;

  constructor(customProfiles?: Record<string, RiskProfile>) {
    this.riskProfiles = { ...RISK_PROFILES, ...customProfiles };
  }

  /**
   * Get risk profile for an action
   */
  getRiskProfile(action: string): RiskProfile | null {
    return this.riskProfiles[action] || null;
  }

  /**
   * Validate policy edit with 4C fields and autonomy level
   */
  validateEdit(
    action: string,
    fields: AugmentLiteFields,
    autonomy: number
  ): ValidationResult {
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
    const warnings: string[] = [];
    if (profile.requiresApproval) {
      warnings.push(
        'This change requires Admin approval before it can be applied'
      );
    }

    if (profile.riskLevel === 'high') {
      warnings.push(
        'High-risk change detected. Please test thoroughly with fixtures before deploying'
      );
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check if action requires approval workflow
   */
  requiresApproval(action: string): boolean {
    const profile = this.getRiskProfile(action);
    return profile?.requiresApproval || false;
  }

  /**
   * Get maximum autonomy level for action
   */
  getMaxAutonomy(action: string): number {
    const profile = this.getRiskProfile(action);
    return profile?.maxAutonomy || 0;
  }

  /**
   * Get risk level for action
   */
  getRiskLevel(action: string): RiskLevel | null {
    const profile = this.getRiskProfile(action);
    return profile?.riskLevel || null;
  }

  /**
   * Validate multiple fields at once
   */
  validateFields(fields: AugmentLiteFields): ValidationResult {
    const errors: string[] = [];

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
