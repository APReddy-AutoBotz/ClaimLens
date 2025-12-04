/**
 * Request Caching and Deduplication Utility
 * Prevents duplicate API calls and caches responses
 */
class RequestCache {
    cache = new Map();
    pendingRequests = new Map();
    defaultTTL = 5 * 60 * 1000; // 5 minutes
    /**
     * Generate cache key from request parameters
     */
    getCacheKey(url, options) {
        const method = options?.method || 'GET';
        const body = options?.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }
    /**
     * Check if cache entry is valid
     */
    isValid(entry) {
        return Date.now() < entry.expiresAt;
    }
    /**
     * Get cached data if available and valid
     */
    get(url, options) {
        const key = this.getCacheKey(url, options);
        const entry = this.cache.get(key);
        if (entry && this.isValid(entry)) {
            return entry.data;
        }
        // Remove expired entry
        if (entry) {
            this.cache.delete(key);
        }
        return null;
    }
    /**
     * Set cache entry
     */
    set(url, data, options, ttl) {
        const key = this.getCacheKey(url, options);
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt,
        });
    }
    /**
     * Clear cache entry
     */
    clear(url, options) {
        const key = this.getCacheKey(url, options);
        this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clearAll() {
        this.cache.clear();
    }
    /**
     * Deduplicate concurrent requests
     */
    async dedupe(url, fetcher, options) {
        const key = this.getCacheKey(url, options);
        // Check if request is already pending
        const pending = this.pendingRequests.get(key);
        if (pending) {
            return pending.promise;
        }
        // Create new request
        const promise = fetcher()
            .then((data) => {
            this.pendingRequests.delete(key);
            return data;
        })
            .catch((error) => {
            this.pendingRequests.delete(key);
            throw error;
        });
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now(),
        });
        return promise;
    }
    /**
     * Fetch with caching and deduplication
     */
    async fetch(url, options, ttl) {
        // Check cache first
        const cached = this.get(url, options);
        if (cached !== null) {
            return cached;
        }
        // Deduplicate concurrent requests
        return this.dedupe(url, async () => {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            const data = await response.json();
            // Cache successful response
            this.set(url, data, options, ttl);
            return data;
        }, options);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
        };
    }
}
// Export singleton instance
export const requestCache = new RequestCache();
