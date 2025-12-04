/**
 * Background Sync for Offline Scans
 * Queues scans when offline and syncs when connection is restored
 */
const QUEUE_KEY = 'claimlens_scan_queue';
const MAX_RETRIES = 3;
/**
 * Add scan to queue
 */
export function queueScan(scan) {
    const queue = getQueue();
    const queuedScan = {
        ...scan,
        id: generateId(),
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
    };
    queue.push(queuedScan);
    saveQueue(queue);
    console.log('Scan queued for sync:', queuedScan.id);
    return queuedScan.id;
}
/**
 * Get all queued scans
 */
export function getQueue() {
    try {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    }
    catch (error) {
        console.error('Error reading scan queue:', error);
        return [];
    }
}
/**
 * Save queue to localStorage
 */
function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
    catch (error) {
        console.error('Error saving scan queue:', error);
    }
}
/**
 * Get pending scans count
 */
export function getPendingCount() {
    const queue = getQueue();
    return queue.filter(scan => scan.status === 'pending').length;
}
/**
 * Update scan status
 */
export function updateScanStatus(id, status, error) {
    const queue = getQueue();
    const scan = queue.find(s => s.id === id);
    if (scan) {
        scan.status = status;
        if (error) {
            scan.error = error;
        }
        saveQueue(queue);
    }
}
/**
 * Process queued scans
 */
export async function processQueue() {
    if (!navigator.onLine) {
        console.log('Offline - skipping queue processing');
        return;
    }
    const queue = getQueue();
    const pendingScans = queue.filter(scan => scan.status === 'pending');
    if (pendingScans.length === 0) {
        console.log('No pending scans to process');
        return;
    }
    console.log(`Processing ${pendingScans.length} queued scans`);
    for (const scan of pendingScans) {
        try {
            updateScanStatus(scan.id, 'syncing');
            // Call the scan API
            const response = await fetch('/v1/consumer/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': scan.id
                },
                body: JSON.stringify({
                    input_type: scan.inputType,
                    input_data: scan.inputData,
                    locale: scan.locale,
                    allergen_profile: scan.allergenProfile
                })
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const result = await response.json();
            // Mark as synced
            updateScanStatus(scan.id, 'synced');
            // Store result in scan history
            storeSyncedResult(scan.id, result);
            console.log('Scan synced successfully:', scan.id);
        }
        catch (error) {
            console.error('Error syncing scan:', scan.id, error);
            // Increment retry count
            const updatedQueue = getQueue();
            const failedScan = updatedQueue.find(s => s.id === scan.id);
            if (failedScan) {
                failedScan.retryCount++;
                if (failedScan.retryCount >= MAX_RETRIES) {
                    failedScan.status = 'failed';
                    failedScan.error = error instanceof Error ? error.message : 'Unknown error';
                    console.error('Scan failed after max retries:', scan.id);
                }
                else {
                    failedScan.status = 'pending';
                    console.log(`Scan will retry (${failedScan.retryCount}/${MAX_RETRIES}):`, scan.id);
                }
                saveQueue(updatedQueue);
            }
        }
    }
    // Clean up old synced scans (keep for 24 hours)
    cleanupQueue();
}
/**
 * Store synced result in scan history
 */
function storeSyncedResult(scanId, result) {
    try {
        const historyKey = 'claimlens_scan_history';
        const historyData = localStorage.getItem(historyKey);
        const history = historyData ? JSON.parse(historyData) : [];
        // Add to history with synced flag
        history.unshift({
            ...result,
            id: scanId,
            timestamp: Date.now(),
            synced: true
        });
        // Keep max 50 items
        if (history.length > 50) {
            history.splice(50);
        }
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
    catch (error) {
        console.error('Error storing synced result:', error);
    }
}
/**
 * Clean up old synced scans
 */
function cleanupQueue() {
    const queue = getQueue();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cleanedQueue = queue.filter(scan => {
        // Keep pending and syncing scans
        if (scan.status === 'pending' || scan.status === 'syncing') {
            return true;
        }
        // Remove synced scans older than 24 hours
        if (scan.status === 'synced' && now - scan.timestamp > oneDayMs) {
            return false;
        }
        // Keep failed scans for 24 hours
        if (scan.status === 'failed' && now - scan.timestamp > oneDayMs) {
            return false;
        }
        return true;
    });
    if (cleanedQueue.length !== queue.length) {
        console.log(`Cleaned up ${queue.length - cleanedQueue.length} old scans from queue`);
        saveQueue(cleanedQueue);
    }
}
/**
 * Clear all queued scans
 */
export function clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
    console.log('Scan queue cleared');
}
/**
 * Remove specific scan from queue
 */
export function removeScan(id) {
    const queue = getQueue();
    const filtered = queue.filter(scan => scan.id !== id);
    saveQueue(filtered);
    console.log('Scan removed from queue:', id);
}
/**
 * Generate unique ID
 */
function generateId() {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Register background sync (if supported)
 */
export async function registerBackgroundSync() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        // Check if Background Sync API is available
        if ('sync' in registration) {
            await registration.sync.register('sync-scans');
            console.log('Background sync registered');
        }
        else {
            console.warn('Background Sync API not supported');
        }
    }
    catch (error) {
        console.error('Error registering background sync:', error);
    }
}
/**
 * Setup automatic sync on online event
 */
export function setupAutoSync() {
    window.addEventListener('online', () => {
        console.log('Connection restored - processing queued scans');
        processQueue();
    });
    // Also try to process queue on page load if online
    if (navigator.onLine) {
        processQueue();
    }
}
