/**
 * Circuit Breaker Pattern Implementation
 * Protects MCP services from cascading failures with CLOSED/OPEN/HALF_OPEN states
 * 
 * Requirements: 13.4, 23.1-23.5
 */

export enum CircuitState {
  CLOSED = 'closed',       // Normal operation
  OPEN = 'open',           // Failing, reject immediately
  HALF_OPEN = 'half_open'  // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening (default: 5)
  successThreshold: number;      // Successes to close from half-open (default: 2)
  timeout: number;               // Timeout in ms (default: 500)
  resetTimeout: number;          // Time before trying half-open (default: 30000)
  maxInflight: number;           // Max concurrent requests (default: 10)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  inflightRequests: number;
  lastFailureTime: number | null;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private inflightRequests: number = 0;
  private config: CircuitBreakerConfig;
  
  constructor(
    private serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 500,
      resetTimeout: 30000,
      maxInflight: 10,
      ...config
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @throws Error if circuit is open or max inflight exceeded
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`Circuit breaker ${this.serviceName}: Entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${this.serviceName} is OPEN`);
      }
    }
    
    // Check max inflight
    if (this.inflightRequests >= this.config.maxInflight) {
      throw new Error(`Circuit breaker ${this.serviceName}: Max inflight requests (${this.config.maxInflight}) exceeded`);
    }
    
    this.inflightRequests++;
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        this.timeoutPromise()
      ]);
      
      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      this.inflightRequests--;
    }
  }
  
  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`Circuit breaker ${this.serviceName}: Closed after ${this.successCount} successful probes`);
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      console.log(`Circuit breaker ${this.serviceName}: Reopened after failure in HALF_OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker ${this.serviceName}: Opened after ${this.failureCount} failures`);
    }
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      inflightRequests: this.inflightRequests,
      lastFailureTime: this.lastFailureTime
    };
  }
  
  /**
   * Reset circuit breaker to CLOSED state (for testing)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.inflightRequests = 0;
  }
}
