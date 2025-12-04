import { memo } from 'react';
import { type Verdict } from '../../../../packages/core/trust-score';
import styles from './VerdictBadge.module.css';

interface VerdictBadgeProps {
  verdict: Verdict;
  compact?: boolean;
}

export const VerdictBadge = memo(function VerdictBadge({ verdict, compact = false }: VerdictBadgeProps) {
  return (
    <div 
      className={`${styles.badge} ${styles[verdict.label]} ${compact ? styles.compact : ''}`}
      role="status"
      aria-label={`Verdict: ${verdict.label}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {verdict.icon}
      </span>
      <span className={styles.label}>
        {verdict.label.charAt(0).toUpperCase() + verdict.label.slice(1)}
      </span>
    </div>
  );
});
