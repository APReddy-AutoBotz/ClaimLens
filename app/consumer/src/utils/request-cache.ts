/**
 * Request Caching and Deduplication Utility
 * Prevents duplicate API calls and caches responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from request parameters
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Get cached data if available and valid
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.getCacheKey(url, options);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.data as T;
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
  set<T>(url: string, data: T, options?: RequestInit, ttl?: number): void {
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
  clear(url: string, options?: RequestInit): void {
    const key = this.getCacheKey(url, options);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Deduplicate concurrent requests
   */
  async dedupe<T>(
    url: string,
    fetcher: () => Promise<T>,
    options?: RequestInit
  ): Promise<T> {
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
  async fetch<T>(
    url: string,
    options?: RequestInit,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(url, options);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return this.dedupe<T>(
      url,
      async () => {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful response
        this.set(url, data, options, ttl);

        return data;
      },
      options
    );
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
