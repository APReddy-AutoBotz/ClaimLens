import { memo, useState, useEffect } from 'react';
import styles from './ReceiptsDrawer.module.css';

interface Receipt {
  ruleId: string;
  ruleName: string;
  packName: string;
  packVersion: string;
  transformStep: string;
  beforeSnippet?: string;
  afterSnippet?: string;
  timestamp: string;
}

interface ReceiptsDrawerProps {
  receipts?: Receipt[];
  correlationId?: string;
  checksRun?: number;
}

export const ReceiptsDrawer = memo(function ReceiptsDrawer({ 
  receipts = [], 
  correlationId,
  checksRun = 0 
}: ReceiptsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="receipts-content"
      >
        <span className={styles.triggerIcon}>📋</span>
        <span className={styles.triggerText}>Receipts</span>
        <span className={styles.triggerSubtext}>No tricks. Just proof.</span>
        <span className={styles.triggerArrow} aria-hidden="true">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div id="receipts-content" className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>Why this verdict?</h3>
            <p className={styles.subtitle}>
              Transparent evidence for every decision
            </p>
          </div>

          {correlationId && (
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Request ID:</span>
                <code className={styles.metaValue}>{correlationId}</code>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Checks run:</span>
                <span className={styles.metaValue}>{checksRun}</span>
              </div>
            </div>
          )}

          {receipts.length === 0 ? (
            <div className={styles.empty}>
              <p>No policy violations detected</p>
              <p className={styles.emptySubtext}>
                All checks passed successfully
              </p>
            </div>
          ) : (
            <div className={styles.receipts}>
              {receipts.map((receipt, index) => (
                <div key={index} className={styles.receipt}>
                  <div className={styles.receiptHeader}>
                    <div className={styles.receiptTitle}>
                      {receipt.ruleName}
                    </div>
                    <div className={styles.receiptBadge}>
                      {receipt.packName} v{receipt.packVersion}
                    </div>
                  </div>

                  <div className={styles.receiptMeta}>
                    <span className={styles.receiptMetaItem}>
                      <strong>Rule ID:</strong> {receipt.ruleId}
                    </span>
                    <span className={styles.receiptMetaItem}>
                      <strong>Transform:</strong> {receipt.transformStep}
                    </span>
                    <span className={styles.receiptMetaItem}>
                      <strong>Time:</strong> {new Date(receipt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {(receipt.beforeSnippet || receipt.afterSnippet) && (
                    <div className={styles.diff}>
                      {receipt.beforeSnippet && (
                        <div className={styles.diffSection}>
                          <div className={styles.diffLabel}>Before:</div>
                          <code className={styles.diffCode}>
                            {receipt.beforeSnippet}
                          </code>
                        </div>
                      )}
                      {receipt.afterSnippet && (
                        <div className={styles.diffSection}>
                          <div className={styles.diffLabel}>After:</div>
                          <code className={styles.diffCode}>
                            {receipt.afterSnippet}
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
