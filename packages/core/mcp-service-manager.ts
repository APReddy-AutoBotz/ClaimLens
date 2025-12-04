/**
 * MCP Service Manager
 * Manages external MCP services with circuit breakers and degraded mode support
 * 
 * Requirements: 13.1, 13.2, 13.4, 23.1-23.8
 */

import { CircuitBreaker, CircuitState } from './circuit-breaker';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export interface MCPServiceDefinition {
  command: string;
  args: string[];
  env: Record<string, string>;
  disabled: boolean;
  autoApprove: string[];
  description: string;
}

export interface MCPRegistry {
  mcpServers: Record<string, MCPServiceDefinition>;
}

export interface DegradedModeConfig {
  critical: boolean;
  action: 'pass_through' | 'modify';
  fallback_behavior: string;
  banner_text: string;
  audit_note: string;
  timeout_ms: number;
  max_retries: number;
  fallback_disclaimer?: string;
}

export interface DegradedModeMatrix {
  services: Record<string, DegradedModeConfig>;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  circuitState: CircuitState;
}

export class MCPServiceManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private degradedModeMatrix: Map<string, DegradedModeConfig> = new Map();
  private serviceRegistry: Map<string, MCPServiceDefinition> = new Map();
  private healthChecks: Map<string, ServiceHealth> = new Map();
  
  constructor(
    private registryPath: string = '.kiro/mcp/registry.json',
    private degradedModePath: string = '.kiro/specs/degraded-mode-matrix.yaml'
  ) {}
  
  /**
   * Load service definitions from registry.json and degraded-mode-matrix.yaml
   */
  async initialize(): Promise<void> {
    // Load MCP registry
    const registryFile = fs.readFileSync(this.registryPath, 'utf-8');
    const registry: MCPRegistry = JSON.parse(registryFile);
    
    for (const [name, definition] of Object.entries(registry.mcpServers)) {
      if (!definition.disabled) {
        this.serviceRegistry.set(name, definition);
      }
    }
    
    // Load degraded mode matrix
    const degradedModeFile = fs.readFileSync(this.degradedModePath, 'utf-8');
    const degradedMode = yaml.parse(degradedModeFile) as DegradedModeMatrix;
    
    for (const [name, config] of Object.entries(degradedMode.services)) {
      this.degradedModeMatrix.set(name, config);
    }
    
    // Initialize circuit breakers for each service
    for (const [name, config] of this.degradedModeMatrix.entries()) {
      this.circuitBreakers.set(
        name,
        new CircuitBreaker(name, {
          timeout: config.timeout_ms,
          failureThreshold: config.max_retries,
          successThreshold: 2,
          resetTimeout: 30000,
          maxInflight: 10
        })
      );
    }
    
    console.log(`MCP Service Manager initialized with ${this.serviceRegistry.size} services`);
  }
  
  /**
   * Call an MCP service with circuit breaker protection
   * Returns null if service is unavailable and fallback is applied
   */
  async callService<T>(
    serviceName: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const breaker = this.circuitBreakers.get(serviceName);
    const config = this.degradedModeMatrix.get(serviceName);
    
    if (!breaker || !config) {
      throw new Error(`Unknown MCP service: ${serviceName}`);
    }
    
    try {
      const result = await breaker.execute(fn);
      
      // Update health check on success
      this.updateHealthCheck(serviceName, 'healthy', 0);
      
      return result;
    } catch (error) {
      console.warn(`MCP service ${serviceName} failed:`, error);
      
      // Update health check on failure
      this.updateHealthCheck(serviceName, 'down', -1);
      
      // Apply fallback based on degraded mode config
      if (!config.critical) {
        return this.applyFallback(serviceName, config);
      }
      
      // Critical service, propagate error
      throw error;
    }
  }
  
  /**
   * Apply fallback behavior for degraded service
   */
  private applyFallback<T>(serviceName: string, config: DegradedModeConfig): T | null {
    console.log(`Applying fallback for ${serviceName}: ${config.action}`);
    
    switch (config.action) {
      case 'pass_through':
        return null; // Skip this transform
      case 'modify':
        return { 
          fallback: true, 
          disclaimer: config.fallback_disclaimer || 'Service unavailable'
        } as T;
      default:
        return null;
    }
  }
  
  /**
   * Check health of a specific service
   */
  async checkHealth(serviceName: string): Promise<boolean> {
    const definition = this.serviceRegistry.get(serviceName);
    if (!definition) {
      return false;
    }
    
    const port = definition.env.PORT || '7000';
    const url = `http://localhost:${port}/health`;
    
    try {
      const start = Date.now();
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(500)
      });
      const duration = Date.now() - start;
      
      if (response.ok) {
        this.updateHealthCheck(serviceName, 'healthy', duration);
        return true;
      } else {
        this.updateHealthCheck(serviceName, 'degraded', duration);
        return false;
      }
    } catch (error) {
      this.updateHealthCheck(serviceName, 'down', -1);
      return false;
    }
  }
  
  /**
   * Update health check status for a service
   */
  private updateHealthCheck(
    serviceName: string,
    status: 'healthy' | 'degraded' | 'down',
    responseTime: number
  ): void {
    const breaker = this.circuitBreakers.get(serviceName);
    const circuitState = breaker ? breaker.getState() : CircuitState.CLOSED;
    
    this.healthChecks.set(serviceName, {
      name: serviceName,
      status,
      lastCheck: new Date(),
      responseTime,
      circuitState
    });
  }
  
  /**
   * Get list of services currently in degraded mode
   */
  getDegradedServices(): string[] {
    return Array.from(this.circuitBreakers.entries())
      .filter(([_, breaker]) => breaker.getState() !== CircuitState.CLOSED)
      .map(([name, _]) => name);
  }
  
  /**
   * Get health status for all services
   */
  getAllHealthChecks(): ServiceHealth[] {
    return Array.from(this.healthChecks.values());
  }
  
  /**
   * Get degraded mode configuration for a service
   */
  getDegradedModeConfig(serviceName: string): DegradedModeConfig | undefined {
    return this.degradedModeMatrix.get(serviceName);
  }
  
  /**
   * Get audit note for degraded service
   */
  getAuditNote(serviceName: string): string | null {
    const config = this.degradedModeMatrix.get(serviceName);
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (config && breaker && breaker.getState() !== CircuitState.CLOSED) {
      return config.audit_note;
    }
    
    return null;
  }
  
  /**
   * Get banner text for degraded services (for Admin Console)
   */
  getDegradedBannerText(): string[] {
    const degradedServices = this.getDegradedServices();
    return degradedServices.map(serviceName => {
      const config = this.degradedModeMatrix.get(serviceName);
      return config?.banner_text || `${serviceName} unavailable`;
    });
  }
  
  /**
   * Reset all circuit breakers (for testing)
   */
  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
    this.healthChecks.clear();
  }
}
