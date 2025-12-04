import { useState, useEffect } from 'react';
import type { PolicyChangeRequest } from '../types';

interface PolicyChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<PolicyChangeRequest, 'id' | 'timestamp' | 'status'>) => void;
  operator: string;
}

interface FormData {
  context: string;
  constraints: string;
  self_critique: string;
}

interface FormErrors {
  context?: string;
  constraints?: string;
  self_critique?: string;
}

const MIN_CONTEXT_CHARS = 200;
const MAX_CONTEXT_CHARS = 2000;
const MIN_CONSTRAINTS_CHARS = 100;
const MAX_CONSTRAINTS_CHARS = 1000;
const MIN_CRITIQUE_CHARS = 100;
const MAX_CRITIQUE_CHARS = 1000;

function PolicyChangeModal({ isOpen, onClose, onSubmit, operator }: PolicyChangeModalProps) {
  const [formData, setFormData] = useState<FormData>({
    context: '',
    constraints: '',
    self_critique: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    const length = value.trim().length;

    switch (name) {
      case 'context':
        if (length < MIN_CONTEXT_CHARS) {
          return `Context must be at least ${MIN_CONTEXT_CHARS} characters`;
        }
        if (length > MAX_CONTEXT_CHARS) {
          return `Context must not exceed ${MAX_CONTEXT_CHARS} characters`;
        }
        break;
      case 'constraints':
        if (length < MIN_CONSTRAINTS_CHARS) {
          return `Constraints must be at least ${MIN_CONSTRAINTS_CHARS} characters`;
        }
        if (length > MAX_CONSTRAINTS_CHARS) {
          return `Constraints must not exceed ${MAX_CONSTRAINTS_CHARS} characters`;
        }
        break;
      case 'self_critique':
        if (length < MIN_CRITIQUE_CHARS) {
          return `Critique must be at least ${MIN_CRITIQUE_CHARS} characters`;
        }
        if (length > MAX_CRITIQUE_CHARS) {
          return `Critique must not exceed ${MAX_CRITIQUE_CHARS} characters`;
        }
        break;
    }

    return undefined;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (name: keyof FormData) => {
    const error = validateField(name, formData[name]);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const isFormValid = (): boolean => {
    const contextError = validateField('context', formData.context);
    const constraintsError = validateField('constraints', formData.constraints);
    const critiqueError = validateField('self_critique', formData.self_critique);

    return !contextError && !constraintsError && !critiqueError;
  };

  const getCharCountClass = (current: number, min: number, max: number): string => {
    if (current < min || current > max) {
      return 'char-count error';
    }
    return 'char-count';
  };

  const generateImpactPreview = () => {
    // Mock impact preview based on form content
    // In a real implementation, this would call an API
    const contextLength = formData.context.trim().length;
    const constraintsLength = formData.constraints.trim().length;
    
    // Simple heuristic for demo purposes
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let estimatedImpact = '~10-20 items affected';
    let confidence = 0.75;

    if (contextLength > 500 || constraintsLength > 300) {
      riskLevel = 'medium';
      estimatedImpact = '~30-50 items affected';
      confidence = 0.65;
    }

    if (contextLength > 1000 || constraintsLength > 600) {
      riskLevel = 'high';
      estimatedImpact = '~50+ items affected';
      confidence = 0.55;
    }

    return {
      affected_rules: ['banned-claims-v2', 'allergen-detection', 'disclaimer-rewrite'],
      risk_level: riskLevel,
      estimated_impact: estimatedImpact,
      confidence,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const contextError = validateField('context', formData.context);
    const constraintsError = validateField('constraints', formData.constraints);
    const critiqueError = validateField('self_critique', formData.self_critique);

    if (contextError || constraintsError || critiqueError) {
      setErrors({
        context: contextError,
        constraints: constraintsError,
        self_critique: critiqueError,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const impactPreview = generateImpactPreview();

      const request: Omit<PolicyChangeRequest, 'id' | 'timestamp' | 'status'> = {
        operator,
        context: formData.context.trim(),
        constraints: formData.constraints.trim(),
        self_critique: formData.self_critique.trim(),
        impact_preview: impactPreview,
      };

      await onSubmit(request);

      // Reset form
      setFormData({
        context: '',
        constraints: '',
        self_critique: '',
      });
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const impactPreview = isFormValid() ? generateImpactPreview() : null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="augment-lite-modal">
        <div className="modal-header">
          <h3 id="modal-title">Request Policy Change</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <p className="modal-description">
            The Augment-Lite flow requires Context, Constraints, and Critique to ensure thoughtful policy changes.
          </p>

          {/* Context Field */}
          <div className="form-group">
            <label htmlFor="context">
              Context <span className="required-indicator">*</span>
            </label>
            <textarea
              id="context"
              value={formData.context}
              onChange={(e) => handleChange('context', e.target.value)}
              onBlur={() => handleBlur('context')}
              placeholder="Describe the situation that requires this policy change. What problem are you solving?"
              rows={5}
              aria-required="true"
              aria-invalid={!!errors.context}
              aria-describedby={errors.context ? 'context-error' : 'context-count'}
            />
            <div className={getCharCountClass(formData.context.length, MIN_CONTEXT_CHARS, MAX_CONTEXT_CHARS)} id="context-count">
              {formData.context.length} / {MIN_CONTEXT_CHARS}-{MAX_CONTEXT_CHARS} characters
            </div>
            {errors.context && (
              <div className="error-message" id="context-error" role="alert">
                {errors.context}
              </div>
            )}
          </div>

          {/* Constraints Field */}
          <div className="form-group">
            <label htmlFor="constraints">
              Constraints <span className="required-indicator">*</span>
            </label>
            <textarea
              id="constraints"
              value={formData.constraints}
              onChange={(e) => handleChange('constraints', e.target.value)}
              onBlur={() => handleBlur('constraints')}
              placeholder="What are the boundaries and limitations for this change? What must remain unchanged?"
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.constraints}
              aria-describedby={errors.constraints ? 'constraints-error' : 'constraints-count'}
            />
            <div className={getCharCountClass(formData.constraints.length, MIN_CONSTRAINTS_CHARS, MAX_CONSTRAINTS_CHARS)} id="constraints-count">
              {formData.constraints.length} / {MIN_CONSTRAINTS_CHARS}-{MAX_CONSTRAINTS_CHARS} characters
            </div>
            {errors.constraints && (
              <div className="error-message" id="constraints-error" role="alert">
                {errors.constraints}
              </div>
            )}
          </div>

          {/* Self-Critique Field */}
          <div className="form-group">
            <label htmlFor="self_critique">
              Self-Critique <span className="required-indicator">*</span>
            </label>
            <textarea
              id="self_critique"
              value={formData.self_critique}
              onChange={(e) => handleChange('self_critique', e.target.value)}
              onBlur={() => handleBlur('self_critique')}
              placeholder="What could go wrong with this change? What are the potential risks or unintended consequences?"
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.self_critique}
              aria-describedby={errors.self_critique ? 'critique-error' : 'critique-count'}
            />
            <div className={getCharCountClass(formData.self_critique.length, MIN_CRITIQUE_CHARS, MAX_CRITIQUE_CHARS)} id="critique-count">
              {formData.self_critique.length} / {MIN_CRITIQUE_CHARS}-{MAX_CRITIQUE_CHARS} characters
            </div>
            {errors.self_critique && (
              <div className="error-message" id="critique-error" role="alert">
                {errors.self_critique}
              </div>
            )}
          </div>

          {/* Impact Preview */}
          {impactPreview && (
            <div className="impact-preview" role="region" aria-label="Impact preview">
              <h4>Impact Preview</h4>
              <div className="impact-content">
                <div className="impact-row">
                  <span className="impact-label">Risk Level:</span>
                  <span className={`risk-indicator risk-${impactPreview.risk_level}`}>
                    {impactPreview.risk_level.charAt(0).toUpperCase() + impactPreview.risk_level.slice(1)}
                  </span>
                </div>
                <div className="impact-row">
                  <span className="impact-label">Estimated Impact:</span>
                  <span>{impactPreview.estimated_impact}</span>
                </div>
                <div className="impact-row">
                  <span className="impact-label">Confidence:</span>
                  <span>{Math.round(impactPreview.confidence * 100)}%</span>
                </div>
                <div className="impact-row">
                  <span className="impact-label">Affected Rules:</span>
                  <div className="affected-rules">
                    {impactPreview.affected_rules.map((rule) => (
                      <code key={rule} className="rule-code">
                        {rule}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isFormValid() || isSubmitting}
              aria-label={isFormValid() ? 'Submit policy change request' : 'Complete all required fields to submit'}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PolicyChangeModal;
