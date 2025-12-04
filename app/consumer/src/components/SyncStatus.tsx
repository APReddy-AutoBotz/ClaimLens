/**
 * Sync Status Indicator
 * Shows pending scans and sync status
 */

import { useBackgroundSync } from '@hooks/useBackgroundSync';
import { useOnlineStatus } from '@hooks/useOnlineStatus';
import styles from './SyncStatus.module.css';

function SyncStatus() {
  const { pendingCount, isSyncing, sync } = useBackgroundSync();
  const isOnline = useOnlineStatus();

  // Don't show if no pending scans
  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.icon}>
          {isSyncing ? (
            <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          )}
        </div>

        <div className={styles.text}>
          {isSyncing ? (
            <span>Syncing {pendingCount} scan{pendingCount !== 1 ? 's' : ''}...</span>
          ) : isOnline ? (
            <span>{pendingCount} scan{pendingCount !== 1 ? 's' : ''} queued</span>
          ) : (
            <span>{pendingCount} scan{pendingCount !== 1 ? 's' : ''} queued for sync</span>
          )}
        </div>

        {isOnline && !isSyncing && (
          <button
            className={styles.syncButton}
            onClick={sync}
            aria-label="Sync now"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
}

export default SyncStatus;
