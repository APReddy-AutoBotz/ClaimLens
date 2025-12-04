/**
 * Circuit Breaker Tests
 * Tests for circuit breaker state transitions, timeout handling, and failure thresholds
 * 
 * Requirements: 13.4, 23.1-23.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  
  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 500,
      resetTimeout: 30000,
      maxInflight: 10
    });
  });
  
  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
    
    it('should transition to OPEN after failure threshold', async () => {
      const failingFn = async () => {
        throw new Error('Service failure');
      };
      
      // Trigger 5 failures
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
    
    it('should transition to HALF_OPEN after reset timeout', async () => {
      const failingFn = async () => {
        throw new Error('Service failure');
      };
      
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      // Fast-forward time by manipulating lastFailureTime
      const stats = breaker.getStats();
      const breaker2 = new CircuitBreaker('test-service-2', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 500,
        resetTimeout: 100, // Short timeout for testing
        maxInflight: 10
      });
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker2.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next call should attempt HALF_OPEN
      const successFn = async () => 'success';
      const result = await breaker2.execute(successFn);
      
      expect(result).toBe('success');
      expect(breaker2.getState()).toBe(CircuitState.HALF_OPEN);
    });
    
    it('should transition from HALF_OPEN to CLOSED after success threshold', async () => {
      const breaker3 = new CircuitBreaker('test-service-3', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 500,
        resetTimeout: 100,
        maxInflight: 10
      });
      
      const failingFn = async () => {
        throw new Error('Service failure');
      };
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker3.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Execute 2 successful calls to close circuit
      const successFn = async () => 'success';
      await breaker3.execute(successFn);
      await breaker3.execute(successFn);
      
      expect(breaker3.getState()).toBe(CircuitState.CLOSED);
    });
    
    it('should transition from HALF_OPEN back to OPEN on failure', async () => {
      const breaker4 = new CircuitBreaker('test-service-4', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 500,
        resetTimeout: 100,
        maxInflight: 10
      });
      
      const failingFn = async () => {
        throw new Error('Service failure');
      };
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker4.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // First success to enter HALF_OPEN
      const successFn = async () => 'success';
      await breaker4.execute(successFn);
      expect(breaker4.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Failure should reopen circuit
      try {
        await breaker4.execute(failingFn);
      } catch (error) {
        // Expected
      }
      
      expect(breaker4.getState()).toBe(CircuitState.OPEN);
    });
  });
  
  describe('Timeout Handling', () => {
    it('should timeout after configured duration', async () => {
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'too slow';
      };
      
      await expect(breaker.execute(slowFn)).rejects.toThrow('Timeout after 500ms');
    });
    
    it('should succeed if function completes within timeout', async () => {
      const fastFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'fast enough';
      };
      
      const result = await breaker.execute(fastFn);
      expect(result).toBe('fast enough');
    });
  });
  
  describe('Max Inflight Requests', () => {
    it('should reject requests exceeding max inflight', async () => {
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'done';
      };
      
      // Start 10 concurrent requests (max inflight)
      const promises = Array.from({ length: 10 }, () => breaker.execute(slowFn));
      
      // 11th request should be rejected
      await expect(breaker.execute(slowFn)).rejects.toThrow('Max inflight requests');
      
      // Wait for all to complete
      await Promise.all(promises);
    });
    
    it('should allow new requests after inflight count decreases', async () => {
      const fastFn = async () => 'done';
      
      // Execute 10 requests sequentially
      for (let i = 0; i < 10; i++) {
        const result = await breaker.execute(fastFn);
        expect(result).toBe('done');
      }
      
      // All should succeed since they complete quickly
      expect(breaker.getStats().inflightRequests).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    it('should track failure count', async () => {
      const failingFn = async () => {
        throw new Error('Failure');
      };
      
      try {
        await breaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
      
      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(1);
    });
    
    it('should reset failure count on success', async () => {
      const failingFn = async () => {
        throw new Error('Failure');
      };
      const successFn = async () => 'success';
      
      // Fail once
      try {
        await breaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
      
      expect(breaker.getStats().failureCount).toBe(1);
      
      // Succeed
      await breaker.execute(successFn);
      
      expect(breaker.getStats().failureCount).toBe(0);
    });
  });
  
  describe('Reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const failingFn = async () => {
        throw new Error('Failure');
      };
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      
      // Reset
      breaker.reset();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failureCount).toBe(0);
    });
  });
});
