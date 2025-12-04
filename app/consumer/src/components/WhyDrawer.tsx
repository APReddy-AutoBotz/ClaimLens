import { useState } from 'react';
import { type TrustScoreBreakdown } from '../../../../packages/core/trust-score';
import styles from './WhyDrawer.module.css';

interface WhyDrawerProps {
  breakdown: TrustScoreBreakdown;
}

export function WhyDrawer({ breakdown }: WhyDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDrawer();
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={toggleDrawer}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="score-breakdown"
      >
        <span>Why this score?</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <div 
          id="score-breakdown"
          className={styles.content}
          role="region"
          aria-label="Score breakdown"
        >
          <div className={styles.breakdownList}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Base Score</span>
              <span className={styles.breakdownValue}>+{breakdown.baseScore}</span>
            </div>

            {breakdown.bannedClaimsDeduction > 0 && (
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Banned Claims</span>
                <span className={`${styles.breakdownValue} ${styles.negative}`}>
                  -{breakdown.bannedClaimsDeduction}
                </span>
              </div>
            )}

            {breakdown.recallDeduction > 0 && (
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Product Recall</span>
                <span className={`${styles.breakdownValue} ${styles.negative}`}>
                  -{breakdown.recallDeduction}
                </span>
              </div>
            )}

            {breakdown.allergenDeduction > 0 && (
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Allergen Concerns</span>
                <span className={`${styles.breakdownValue} ${styles.negative}`}>
                  -{breakdown.allergenDeduction}
                </span>
              </div>
            )}

            {breakdown.weaselWordDeduction > 0 && (
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Vague Claims</span>
                <span className={`${styles.breakdownValue} ${styles.negative}`}>
                  -{breakdown.weaselWordDeduction}
                </span>
              </div>
            )}

            {breakdown.cleanBonus > 0 && (
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Clean Bonus</span>
                <span className={`${styles.breakdownValue} ${styles.positive}`}>
                  +{breakdown.cleanBonus}
                </span>
              </div>
            )}

            <div className={`${styles.breakdownItem} ${styles.total}`}>
              <span className={styles.breakdownLabel}>Final Score</span>
              <span className={styles.breakdownValue}>{breakdown.finalScore}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
