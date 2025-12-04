/**
 * Structured Logger for ClaimLens
 * Provides JSON-formatted logging with PII redaction and sampling
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string; // ISO 8601 timestamp
  level: LogLevel;
  tenant?: string;
  request_id: string; // Correlation ID
  profile?: string;
  route?: string;
  transform?: string;
  decision?: string;
  reason?: string;
  duration_ms?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  enableSampling?: boolean;
  samplingThreshold?: number; // QPS threshold for sampling
  samplingRate?: number; // Percentage to sample (0-1)
  redactPII?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * PII patterns for redaction
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+91[\s-]?)?[6-9]\d{9}\b/g,
  pincode: /\b\d{6}\b/g,
};

/**
 * Redact PII from text
 */
function redactPII(text: string): string {
  let redacted = text;
  redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  // Only redact pincodes if preceded by context words
  redacted = redacted.replace(
    /(pin\s?code|pincode|postal\s?code|zip\s?code)[\s:]*\d{6}/gi,
    '$1 [PINCODE_REDACTED]'
  );
  return redacted;
}

/**
 * Redact PII from objects recursively
 */
function redactPIIFromObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactPII(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactPIIFromObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      redacted[key] = redactPIIFromObject(value);
    }
    return redacted;
  }
  
  return obj;
}

/**
 * Structured Logger class
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private requestCounts: Map<number, number> = new Map(); // timestamp -> count
  private lastCleanup: number = Date.now();

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || 'info',
      enableSampling: config.enableSampling !== false,
      samplingThreshold: config.samplingThreshold || 1000,
      samplingRate: config.samplingRate || 0.1,
      redactPII: config.redactPII !== false,
    };
  }

  /**
   * Log a debug message
   */
  debug(entry: Partial<LogEntry>): void {
    this.log({ ...entry, level: 'debug' });
  }

  /**
   * Log an info message
   */
  info(entry: Partial<LogEntry>): void {
    this.log({ ...entry, level: 'info' });
  }

  /**
   * Log a warning message
   */
  warn(entry: Partial<LogEntry>): void {
    this.log({ ...entry, level: 'warn' });
  }

  /**
   * Log an error message
   */
  error(entry: Partial<LogEntry>): void {
    this.log({ ...entry, level: 'error' });
  }

  /**
   * Main logging method
   */
  log(entry: Partial<LogEntry>): void {
    const level = entry.level || 'info';

    // Check if level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    // Apply sampling if enabled
    if (this.config.enableSampling && !this.shouldSample()) {
      return;
    }

    // Build full log entry
    const fullEntry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      request_id: entry.request_id || this.generateId(),
      ...entry,
    };

    // Redact PII if enabled
    if (this.config.redactPII) {
      if (fullEntry.metadata) {
        fullEntry.metadata = redactPIIFromObject(fullEntry.metadata);
      }
      if (fullEntry.reason) {
        fullEntry.reason = redactPII(fullEntry.reason);
      }
      if (fullEntry.error?.message) {
        fullEntry.error.message = redactPII(fullEntry.error.message);
      }
    }

    // Output as JSON
    console.log(JSON.stringify(fullEntry));
  }

  /**
   * Track request and determine if we should sample
   */
  private shouldSample(): boolean {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);

    // Track request count
    const count = (this.requestCounts.get(currentSecond) || 0) + 1;
    this.requestCounts.set(currentSecond, count);

    // Cleanup old entries every 10 seconds
    if (now - this.lastCleanup > 10000) {
      this.cleanup(currentSecond);
      this.lastCleanup = now;
    }

    // Calculate current QPS (average over last 5 seconds)
    const qps = this.getCurrentQPS(currentSecond);

    // If QPS exceeds threshold, apply sampling
    if (qps > this.config.samplingThreshold) {
      return Math.random() < this.config.samplingRate;
    }

    return true; // Log everything below threshold
  }

  /**
   * Calculate current QPS
   */
  private getCurrentQPS(currentSecond: number): number {
    let total = 0;
    let count = 0;

    // Average over last 5 seconds
    for (let i = 0; i < 5; i++) {
      const second = currentSecond - i;
      const requests = this.requestCounts.get(second) || 0;
      total += requests;
      count++;
    }

    return count > 0 ? total / count : 0;
  }

  /**
   * Cleanup old request counts
   */
  private cleanup(currentSecond: number): void {
    const cutoff = currentSecond - 10; // Keep last 10 seconds
    for (const [second] of this.requestCounts) {
      if (second < cutoff) {
        this.requestCounts.delete(second);
      }
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with custom configuration
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
