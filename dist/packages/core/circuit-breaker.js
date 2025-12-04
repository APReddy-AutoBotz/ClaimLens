/**
 * Circuit Breaker Pattern Implementation
 * Protects MCP services from cascading failures with CLOSED/OPEN/HALF_OPEN states
 *
 * Requirements: 13.4, 23.1-23.5
 */
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open"; // Testing if service recovered
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    serviceName;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime = null;
    inflightRequests = 0;
    config;
    constructor(serviceName, config = {}) {
        this.serviceName = serviceName;
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
    async execute(fn) {
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            // Check if we should try half-open
            if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
                console.log(`Circuit breaker ${this.serviceName}: Entering HALF_OPEN state`);
            }
            else {
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
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
        finally {
            this.inflightRequests--;
        }
    }
    timeoutPromise() {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);
        });
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.state = CircuitState.CLOSED;
                console.log(`Circuit breaker ${this.serviceName}: Closed after ${this.successCount} successful probes`);
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.successCount = 0;
            console.log(`Circuit breaker ${this.serviceName}: Reopened after failure in HALF_OPEN`);
        }
        else if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            console.log(`Circuit breaker ${this.serviceName}: Opened after ${this.failureCount} failures`);
        }
    }
    /**
     * Get current circuit breaker state
     */
    getState() {
        return this.state;
    }
    /**
     * Get circuit breaker statistics
     */
    getStats() {
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
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.inflightRequests = 0;
    }
}
