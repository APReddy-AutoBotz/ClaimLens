/**
 * Hook for background sync functionality
 */

import { useState, useEffect } from 'react';
import { 
  getQueue, 
  getPendingCount, 
  processQueue, 
  setupAutoSync,
  type QueuedScan 
} from '@utils/background-sync';

export function useBackgroundSync() {
  const [queue, setQueue] = useState<QueuedScan[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue on mount
  useEffect(() => {
    updateQueue();
    
    // Setup auto-sync
    setupAutoSync();
    
    // Poll for queue updates every 5 seconds
    const interval = setInterval(updateQueue, 5000);
    
    return () => clearInterval(interval);
  }, []);

  function updateQueue() {
    const currentQueue = getQueue();
    setQueue(currentQueue);
    setPendingCount(getPendingCount());
  }

  async function sync() {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await processQueue();
      updateQueue();
    } catch (error) {
      console.error('Error syncing queue:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  return {
    queue,
    pendingCount,
    isSyncing,
    sync,
    refresh: updateQueue
  };
}
