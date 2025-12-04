import styles from './ScanProgress.module.css';

export type ScanStage = 'idle' | 'extract' | 'checks' | 'verdict' | 'complete' | 'error';

interface ScanProgressProps {
  stage: ScanStage;
  error?: string;
}

const STAGE_LABELS: Record<ScanStage, string> = {
  idle: 'Ready to scan',
  extract: 'Extracting content...',
  checks: 'Running policy checks...',
  verdict: 'Calculating verdict...',
  complete: 'Analysis complete',
  error: 'Something went wrong'
};

const STAGE_ICONS: Record<ScanStage, string> = {
  idle: '🔍',
  extract: '📄',
  checks: '🔬',
  verdict: '⚖️',
  complete: '✅',
  error: '⚠️'
};

function ScanProgress({ stage, error }: ScanProgressProps) {
  const isActive = stage !== 'idle' && stage !== 'complete' && stage !== 'error';
  const isError = stage === 'error';
  const isComplete = stage === 'complete';

  return (
    <div 
      className={`${styles.container} ${isActive ? styles.active : ''} ${isError ? styles.error : ''} ${isComplete ? styles.complete : ''}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div className={styles.iconWrapper}>
        <span className={styles.icon} aria-hidden="true">
          {STAGE_ICONS[stage]}
        </span>
        {isActive && (
          <div className={styles.spectralGlow} aria-hidden="true" />
        )}
      </div>
      
      <div className={styles.content}>
        <p className={styles.label}>
          {STAGE_LABELS[stage]}
        </p>
        
        {error && isError && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )}
        
        {isActive && (
          <div className={styles.progressBar} aria-hidden="true">
            <div className={styles.progressFill} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanProgress;
