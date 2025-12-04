import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './SpectralScan.module.css';

export interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'scanning' | 'found' | 'clear' | 'skipped';
  evidence?: string;
  timestamp?: number;
}

interface SpectralScanProps {
  steps: ScanStep[];
  onComplete?: () => void;
  isActive: boolean;
}

export function SpectralScan({ steps, onComplete, isActive }: SpectralScanProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [visibleSteps, setVisibleSteps] = useState<ScanStep[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug: Check if component is actually visible
  useEffect(() => {
    if (isActive && containerRef.current && process.env.NODE_ENV !== 'production') {
      const rect = containerRef.current.getBoundingClientRect();
      const computed = window.getComputedStyle(containerRef.current);
      console.log('🔍 SpectralScan Debug:', {
        width: rect.width,
        height: rect.height,
        opacity: computed.opacity,
        visibility: computed.visibility,
        zIndex: computed.zIndex,
        display: computed.display
      });
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(-1);
      setVisibleSteps([]);
      return;
    }

    // Progressive reveal of steps
    const revealNextStep = () => {
      setCurrentStepIndex(prev => {
        const nextIndex = prev + 1;
        
        if (nextIndex >= steps.length) {
          // All steps complete
          if (onComplete) {
            setTimeout(onComplete, 300);
          }
          return prev;
        }

        // Update visible steps
        setVisibleSteps(steps.slice(0, nextIndex + 1));

        // Schedule next step
        const delay = prefersReducedMotion ? 150 : (250 + Math.random() * 200);
        timerRef.current = setTimeout(revealNextStep, delay);

        return nextIndex;
      });
    };

    // Start the sequence
    timerRef.current = setTimeout(revealNextStep, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, steps, onComplete, prefersReducedMotion]);

  if (!isActive) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={styles.container} 
      role="status" 
      aria-live="polite" 
      data-modal="true"
      data-testid="spectral-scan-card"
    >
      <div className={styles.header}>
        <span className={styles.icon}>🔬</span>
        <h3 className={styles.title}>Forensic Analysis</h3>
      </div>

      <div className={styles.steps}>
        {visibleSteps.length === 0 && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#14B8A6',
            fontSize: '16px',
            fontWeight: 500
          }}>
            Initializing scan...
          </div>
        )}
        {visibleSteps.map((step, index) => {
          const isScanning = index === currentStepIndex && step.status === 'scanning';
          const isComplete = index < currentStepIndex || ['found', 'clear', 'skipped'].includes(step.status);

          return (
            <div
              key={step.id}
              className={`${styles.step} ${isScanning ? styles.stepScanning : ''} ${isComplete ? styles.stepComplete : ''}`}
              data-status={step.status}
            >
              <div className={styles.stepIndicator}>
                {step.status === 'scanning' && (
                  <div className={styles.scanningPulse} aria-hidden="true" />
                )}
                {step.status === 'found' && (
                  <span className={styles.statusIcon} aria-label="Issue found">⚠️</span>
                )}
                {step.status === 'clear' && (
                  <span className={styles.statusIcon} aria-label="Clear">✓</span>
                )}
                {step.status === 'skipped' && (
                  <span className={styles.statusIcon} aria-label="Skipped">—</span>
                )}
              </div>

              <div className={styles.stepContent}>
                <div className={styles.stepLabel}>{step.label}</div>
                {step.evidence && isComplete && (
                  <div className={styles.stepEvidence}>
                    <span className={styles.evidenceIcon}>📋</span>
                    <span className={styles.evidenceText}>{step.evidence}</span>
                  </div>
                )}
                {step.status === 'scanning' && (
                  <div className={styles.stepStatus}>Analyzing...</div>
                )}
              </div>

              {!prefersReducedMotion && isScanning && (
                <div className={styles.scanLine} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
