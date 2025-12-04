import { memo } from 'react';
import styles from './VerdictBanner.module.css';

export type VerdictLabel = 'allow' | 'modify' | 'avoid';

interface VerdictBannerProps {
  verdict: VerdictLabel;
  score: number;
  reason?: string;
}

// Kiroween-flavored microcopy mapping
const VERDICT_MICROCOPY: Record<VerdictLabel, string> = {
  allow: "Marked safe… for now.",
  modify: "Proceed with caution.",
  avoid: "Do not invite this into your body."
};

const VERDICT_ICONS: Record<VerdictLabel, string> = {
  allow: '✓',
  modify: '⚠',
  avoid: '✕'
};

const VERDICT_COLORS: Record<VerdictLabel, string> = {
  allow: '#10B981',
  modify: '#F59E0B',
  avoid: '#EF4444'
};

export const VerdictBanner = memo(function VerdictBanner({ 
  verdict, 
  score,
  reason 
}: VerdictBannerProps) {
  const microcopy = VERDICT_MICROCOPY[verdict];
  const icon = VERDICT_ICONS[verdict];
  const color = VERDICT_COLORS[verdict];

  return (
    <div 
      className={`${styles.banner} ${styles[verdict]}`}
      role="status"
      aria-label={`Verdict: ${verdict}, Trust Score: ${score}`}
    >
      <div className={styles.header}>
        <div 
          className={styles.badge}
          style={{
            backgroundColor: `${color}20`,
            borderColor: color,
            color: color,
          }}
        >
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
          <span className={styles.label}>
            {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
          </span>
        </div>
      </div>
      
      <div className={styles.content}>
        <p className={styles.microcopy}>
          {microcopy}
        </p>
        {reason && (
          <p className={styles.reason}>
            {reason}
          </p>
        )}
      </div>
    </div>
  );
});
