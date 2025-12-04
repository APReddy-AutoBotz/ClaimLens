/**
 * API Configuration for ClaimLens Consumer App
 * Handles production vs development API routing
 */

// Check if we're on Netlify production
const isNetlifyProduction = typeof window !== 'undefined' && 
  window.location.hostname.includes('netlify.app');

// Check if we're in demo mode (no backend available)
const isDemoMode = isNetlifyProduction;

/**
 * Get the API base URL
 * - In development: uses VITE_API_BASE_URL or proxy to localhost:8080
 * - In production (Netlify): uses relative paths or demo mode
 */
export function getApiBaseUrl(): string {
  // Use env var if set
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // In production on Netlify, use relative paths (will be handled by redirects or demo mode)
  if (isNetlifyProduction) {
    return '';
  }
  
  // In development, Vite proxy handles /v1/* -> localhost:8080
  return '';
}

/**
 * Check if the app is running in demo mode (no backend)
 */
export function isInDemoMode(): boolean {
  return isDemoMode;
}

/**
 * Runtime guard: log error if trying to call localhost from production
 */
export function guardAgainstLocalhost(url: string): void {
  if (isNetlifyProduction && url.includes('localhost')) {
    console.error(
      '[ClaimLens] ERROR: Attempted to call localhost from production deployment.',
      'This will fail. URL:', url
    );
  }
}

/**
 * Build a full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const fullUrl = baseUrl ? `${baseUrl}${path}` : path;
  
  guardAgainstLocalhost(fullUrl);
  
  return fullUrl;
}
