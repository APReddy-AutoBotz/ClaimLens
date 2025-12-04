/**
 * SSRF Defense Utilities
 * URL validation, host allowlisting, private IP blocking
 * Requirements: 18.3
 */

import { URL } from 'url';

/**
 * Allowed MCP service hosts
 * In production, only allowlisted hosts are permitted
 */
const ALLOWED_MCP_HOSTS = [
  'localhost',
  '127.0.0.1',
  'mcp.claimlens.internal',
  'mcp-services', // Docker service name
];

/**
 * Private IP ranges to block (RFC 1918, RFC 4193)
 */
const PRIVATE_IP_RANGES = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^169\.254\./,              // 169.254.0.0/16 (link-local)
  /^fc00:/,                   // fc00::/7 (IPv6 ULA)
  /^fe80:/,                   // fe80::/10 (IPv6 link-local)
  /^::1$/,                    // IPv6 loopback
];

/**
 * Check if environment is development
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Check if IP address is private
 */
function isPrivateIP(hostname: string): boolean {
  // Allow localhost in development
  if (isDevelopment() && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
    return false;
  }

  // Check against private IP ranges
  return PRIVATE_IP_RANGES.some(pattern => pattern.test(hostname));
}

/**
 * Validate MCP service URL
 * Checks host allowlist and blocks private IPs in production
 */
export function validateMCPUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Enforce HTTPS in production
    if (!isDevelopment() && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'HTTPS required for MCP service URLs in production',
      };
    }

    // Check host allowlist
    const hostname = parsed.hostname;
    if (!ALLOWED_MCP_HOSTS.includes(hostname)) {
      return {
        valid: false,
        error: `Host "${hostname}" is not in the MCP service allowlist`,
      };
    }

    // Block private IP ranges in production
    if (!isDevelopment() && isPrivateIP(hostname)) {
      return {
        valid: false,
        error: 'Private IP addresses are not allowed in production',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Add host to allowlist (for testing/configuration)
 */
export function addAllowedHost(host: string): void {
  if (!ALLOWED_MCP_HOSTS.includes(host)) {
    ALLOWED_MCP_HOSTS.push(host);
  }
}

/**
 * Get current allowlist (for debugging)
 */
export function getAllowedHosts(): string[] {
  return [...ALLOWED_MCP_HOSTS];
}

/**
 * Fetch with SSRF protection
 * Validates URL, enforces timeout and size limits
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  maxResponseSize: number = 1024 * 1024 // 1MB default
): Promise<Response> {
  // Validate URL
  const validation = validateMCPUrl(url);
  if (!validation.valid) {
    throw new Error(`SSRF validation failed: ${validation.error}`);
  }

  // Set default timeout (500ms)
  const timeout = 500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check response size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxResponseSize) {
      throw new Error(`Response size ${contentLength} exceeds maximum ${maxResponseSize} bytes`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
