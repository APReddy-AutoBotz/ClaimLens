import { useEffect, useState } from 'react';
import styles from './BusinessModeModal.module.css';

interface BusinessModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Check if we're on Netlify production
const isProduction = typeof window !== 'undefined' && 
  window.location.hostname.includes('netlify.app');

export function BusinessModeModal({ isOpen, onClose }: BusinessModeModalProps) {
  const [adminRunning, setAdminRunning] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // In production, admin is not available - skip the check
      if (isProduction) {
        setAdminRunning(false);
        setChecking(false);
        return;
      }
      // Check if admin app is running on port 3000 (local dev only)
      fetch('http://localhost:3000')
        .then(() => setAdminRunning(true))
        .catch(() => setAdminRunning(false))
        .finally(() => setChecking(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={styles.backdrop} 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-mode-title"
    >
      <div className={styles.modal}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className={styles.icon}>🏢</div>
        
        <h2 id="business-mode-title" className={styles.title}>
          Business Mode
        </h2>

        {checking ? (
          <p className={styles.checking}>Checking if Admin app is running...</p>
        ) : adminRunning ? (
          <>
            <p className={styles.description}>
              The Admin app is running! Click below to access Business features.
            </p>
            <a 
              href="http://localhost:3000" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.primaryButton}
            >
              Open Admin App →
            </a>
          </>
        ) : (
          <>
            <p className={styles.description}>
              {isProduction 
                ? 'The Admin app is available for local development only.'
                : 'The Business/Admin app runs separately and provides B2B features.'}
            </p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>📊</span>
                <span>Bulk menu processing</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🏢</span>
                <span>Tenant management</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🔑</span>
                <span>API key management</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🔗</span>
                <span>Webhook configuration</span>
              </div>
            </div>

            {!isProduction && (
              <div className={styles.instructions}>
                <h3 className={styles.instructionsTitle}>To start the Admin app:</h3>
                <ol className={styles.steps}>
                  <li>Open a new terminal</li>
                  <li>Run: <code>cd app/admin && pnpm dev</code></li>
                  <li>Visit: http://localhost:3000</li>
                </ol>
              </div>
            )}

            {isProduction && (
              <div className={styles.instructions}>
                <p>Clone the repo and run locally to access Admin features:</p>
                <code style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                  github.com/APReddy-AutoBotz/ClaimLens
                </code>
              </div>
            )}

            <button 
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Got it, thanks!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
