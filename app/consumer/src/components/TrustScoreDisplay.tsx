import { memo, useState, useEffect, useRef } from 'react';
import { type TrustScoreBreakdown } from '../../../../packages/core/trust-score';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './TrustScoreDisplay.module.css';

interface TrustScoreDisplayProps {
  score: number;
  breakdown?: TrustScoreBreakdown;
}

export const TrustScoreDisplay = memo(function TrustScoreDisplay({ 
  score, 
  breakdown 
}: TrustScoreDisplayProps) {
  // Clamp score to 0-100 range
  const clampedScore = Math.max(0, Math.min(100, score));
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const animationRef = useRef<number>();

  // Animate score count-up
  useEffect(() => {
    // Skip animation if reduced motion preferred
    if (prefersReducedMotion) {
      setDisplayScore(clampedScore);
      return;
    }

    // Animate score from 0 to final value
    const duration = 800; // ms
    const startTime = Date.now();
    const startScore = 0;
    const endScore = clampedScore;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const currentScore = Math.round(startScore + (endScore - startScore) * easeProgress);

      setDisplayScore(currentScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clampedScore, prefersReducedMotion]);
  
  return (
    <div className={styles.container}>
      <div className={styles.scoreSection}>
        <div className={styles.label}>Trust Score</div>
        <div 
          className={styles.score}
          role="status"
          aria-label={`Trust score: ${clampedScore} out of 100`}
        >
          {displayScore}
        </div>
        <div className={styles.maxScore}>/ 100</div>
      </div>
      
      {breakdown && (
        <div className={styles.breakdownSection}>
          <button
            className={styles.breakdownToggle}
            onClick={() => setShowBreakdown(!showBreakdown)}
            aria-expanded={showBreakdown}
            aria-controls="score-breakdown"
          >
            {showBreakdown ? '▼' : '▶'} Score Breakdown
          </button>
          
          {showBreakdown && (
            <div 
              id="score-breakdown"
              className={styles.breakdown}
              role="region"
              aria-label="Trust score breakdown details"
            >
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Base Score</span>
                <span className={styles.breakdownValue}>+{breakdown.baseScore}</span>
              </div>
              
              {breakdown.bannedClaimsDeduction > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Banned Claims</span>
                  <span className={`${styles.breakdownValue} ${styles.deduction}`}>
                    -{breakdown.bannedClaimsDeduction}
                  </span>
                </div>
              )}
              
              {breakdown.recallDeduction > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Recall Signals</span>
                  <span className={`${styles.breakdownValue} ${styles.deduction}`}>
                    -{breakdown.recallDeduction}
                  </span>
                </div>
              )}
              
              {breakdown.allergenDeduction > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>User Allergens</span>
                  <span className={`${styles.breakdownValue} ${styles.deduction}`}>
                    -{breakdown.allergenDeduction}
                  </span>
                </div>
              )}
              
              {breakdown.weaselWordDeduction > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Weasel Words</span>
                  <span className={`${styles.breakdownValue} ${styles.deduction}`}>
                    -{breakdown.weaselWordDeduction}
                  </span>
                </div>
              )}
              
              {breakdown.cleanBonus > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Clean Bonus</span>
                  <span className={`${styles.breakdownValue} ${styles.bonus}`}>
                    +{breakdown.cleanBonus}
                  </span>
                </div>
              )}
              
              <div className={`${styles.breakdownItem} ${styles.total}`}>
                <span className={styles.breakdownLabel}>Final Score</span>
                <span className={styles.breakdownValue}>{breakdown.finalScore}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
