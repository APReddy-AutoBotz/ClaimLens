import { memo } from 'react';
import styles from './ProofStrip.module.css';

const trustAnchors = [
  { label: 'Processed locally by default', icon: '🔒', description: 'Your data stays on your device' },
  { label: 'No account required', icon: '👤', description: 'Start scanning immediately' },
  { label: 'Receipts included', icon: '📋', description: 'Full evidence trail for every check' },
];

export const ProofStrip = memo(function ProofStrip() {
  return (
    <div className={styles.container}>
      <div className={styles.trustAnchors}>
        {trustAnchors.map((anchor) => (
          <div key={anchor.label} className={styles.trustAnchor}>
            <span className={styles.anchorIcon} aria-hidden="true">{anchor.icon}</span>
            <div className={styles.anchorContent}>
              <span className={styles.anchorLabel}>{anchor.label}</span>
              <span className={styles.anchorDescription}>{anchor.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
