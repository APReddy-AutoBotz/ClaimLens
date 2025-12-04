/**
 * ClaimLens Policy Loader
 * Loads and validates policy files with versioning and rule pack management
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { createHash } from 'crypto';
import type { Policy } from './pipeline.js';

// ============================================================================
// Rule Pack Types
// ============================================================================

export interface RulePack {
  name: string;
  version: string;
  content: any;
  signature?: string;
  loaded_at: Date;
}

export interface PolicyLoaderConfig {
  policyPath: string;
  rulePacksDir: string;
  cacheTTL?: number; // milliseconds
  verifySignatures?: boolean;
}

// ============================================================================
// Policy Cache
// ============================================================================

interface CachedPolicy {
  policy: Policy;
  loaded_at: Date;
  ttl: number;
}

export class PolicyCache {
  private cache: Map<string, CachedPolicy> = new Map();

  set(key: string, policy: Policy, ttl: number): void {
    this.cache.set(key, {
      policy,
      loaded_at: new Date(),
      ttl
    });
  }

  get(key: string): Policy | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    const age = Date.now() - cached.loaded_at.getTime();
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.policy;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Policy Loader
// ============================================================================

export class PolicyLoader {
  private config: PolicyLoaderConfig;
  private cache: PolicyCache;
  private rulePacks: Map<string, RulePack> = new Map();

  constructor(config: PolicyLoaderConfig) {
    this.config = {
      cacheTTL: 300000, // 5 minutes default
      verifySignatures: false,
      ...config
    };
    this.cache = new PolicyCache();
  }

  /**
   * Load policy from YAML file
   */
  loadPolicy(useCache: boolean = true): Policy {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(this.config.policyPath);
      if (cached) {
        return cached;
      }
    }

    try {
      // Read and parse YAML
      const yamlContent = readFileSync(this.config.policyPath, 'utf-8');
      const parsed = parseYaml(yamlContent);

      // Validate structure
      this.validatePolicy(parsed);

      // Extract version
      const policy: Policy = {
        version: parsed.version || '0.0.0',
        profiles: parsed.profiles || {}
      };

      // Cache the policy
      this.cache.set(
        this.config.policyPath,
        policy,
        this.config.cacheTTL!
      );

      return policy;
    } catch (error) {
      throw new Error(
        `Failed to load policy from ${this.config.policyPath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Validate policy structure
   */
  private validatePolicy(policy: any): void {
    if (!policy || typeof policy !== 'object') {
      throw new Error('Policy must be an object');
    }

    if (!policy.version || typeof policy.version !== 'string') {
      throw new Error('Policy must have a version string');
    }

    // Validate semantic version format
    if (!this.isValidSemanticVersion(policy.version)) {
      throw new Error(
        `Invalid semantic version: ${policy.version}. Expected format: MAJOR.MINOR.PATCH`
      );
    }

    if (!policy.profiles || typeof policy.profiles !== 'object') {
      throw new Error('Policy must have profiles object');
    }

    // Validate each profile
    for (const [profileName, profile] of Object.entries(policy.profiles)) {
      this.validateProfile(profileName, profile);
    }
  }

  /**
   * Validate profile structure
   */
  private validateProfile(name: string, profile: any): void {
    if (!profile || typeof profile !== 'object') {
      throw new Error(`Profile ${name} must be an object`);
    }

    if (!Array.isArray(profile.routes)) {
      throw new Error(`Profile ${name} must have routes array`);
    }

    // Validate each route
    for (const route of profile.routes) {
      this.validateRoute(name, route);
    }
  }

  /**
   * Validate route structure
   */
  private validateRoute(profileName: string, route: any): void {
    if (!route || typeof route !== 'object') {
      throw new Error(`Route in profile ${profileName} must be an object`);
    }

    if (!route.path || typeof route.path !== 'string') {
      throw new Error(`Route in profile ${profileName} must have path string`);
    }

    if (!Array.isArray(route.transforms)) {
      throw new Error(`Route ${route.path} must have transforms array`);
    }
  }

  /**
   * Check if version string is valid semantic version
   */
  private isValidSemanticVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }

  /**
   * Load rule pack from file
   */
  loadRulePack(name: string): RulePack {
    // Check if already loaded
    if (this.rulePacks.has(name)) {
      return this.rulePacks.get(name)!;
    }

    try {
      const packPath = `${this.config.rulePacksDir}/${name}`;
      const content = readFileSync(packPath, 'utf-8');

      // Parse based on file extension
      let parsed: any;
      if (packPath.endsWith('.yaml') || packPath.endsWith('.yml')) {
        parsed = parseYaml(content);
      } else if (packPath.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else {
        parsed = content; // Plain text
      }

      // Calculate signature
      const signature = this.calculateSignature(content);

      // Verify signature if required
      if (this.config.verifySignatures && parsed.signature) {
        if (signature !== parsed.signature) {
          throw new Error(`Signature verification failed for ${name}`);
        }
      }

      const rulePack: RulePack = {
        name,
        version: parsed.version || '1.0.0',
        content: parsed,
        signature,
        loaded_at: new Date()
      };

      this.rulePacks.set(name, rulePack);
      return rulePack;
    } catch (error) {
      throw new Error(
        `Failed to load rule pack ${name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Calculate SHA-256 signature for content
   */
  private calculateSignature(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get loaded rule pack
   */
  getRulePack(name: string): RulePack | undefined {
    return this.rulePacks.get(name);
  }

  /**
   * Reload policy (invalidate cache and reload)
   */
  reloadPolicy(): Policy {
    this.cache.invalidate(this.config.policyPath);
    return this.loadPolicy(false);
  }

  /**
   * Reload rule pack
   */
  reloadRulePack(name: string): RulePack {
    this.rulePacks.delete(name);
    return this.loadRulePack(name);
  }

  /**
   * Get all loaded rule packs
   */
  getAllRulePacks(): RulePack[] {
    return Array.from(this.rulePacks.values());
  }
}
