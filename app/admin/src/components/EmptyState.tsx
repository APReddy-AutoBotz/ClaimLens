import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  ctaLabel,
  onCtaClick,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {icon}
      </div>
      <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cl-cloud)', marginBottom: '0.5rem' }}>
        {title}
      </p>
      {description && (
        <p className="empty-state-hint" style={{ marginBottom: '1.5rem' }}>
          {description}
        </p>
      )}
      {ctaLabel && onCtaClick && (
        <button 
          className="btn btn-primary" 
          onClick={onCtaClick}
          aria-label={ctaLabel}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
