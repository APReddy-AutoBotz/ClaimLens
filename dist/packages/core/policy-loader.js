/**
 * ClaimLens Policy Loader
 * Loads and validates policy files with versioning and rule pack management
 */
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { createHash } from 'crypto';
export class PolicyCache {
    cache = new Map();
    set(key, policy, ttl) {
        this.cache.set(key, {
            policy,
            loaded_at: new Date(),
            ttl
        });
    }
    get(key) {
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
    invalidate(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
// ============================================================================
// Policy Loader
// ============================================================================
export class PolicyLoader {
    config;
    cache;
    rulePacks = new Map();
    constructor(config) {
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
    loadPolicy(useCache = true) {
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
            const policy = {
                version: parsed.version || '0.0.0',
                profiles: parsed.profiles || {}
            };
            // Cache the policy
            this.cache.set(this.config.policyPath, policy, this.config.cacheTTL);
            return policy;
        }
        catch (error) {
            throw new Error(`Failed to load policy from ${this.config.policyPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate policy structure
     */
    validatePolicy(policy) {
        if (!policy || typeof policy !== 'object') {
            throw new Error('Policy must be an object');
        }
        if (!policy.version || typeof policy.version !== 'string') {
            throw new Error('Policy must have a version string');
        }
        // Validate semantic version format
        if (!this.isValidSemanticVersion(policy.version)) {
            throw new Error(`Invalid semantic version: ${policy.version}. Expected format: MAJOR.MINOR.PATCH`);
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
    validateProfile(name, profile) {
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
    validateRoute(profileName, route) {
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
    isValidSemanticVersion(version) {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        return semverRegex.test(version);
    }
    /**
     * Load rule pack from file
     */
    loadRulePack(name) {
        // Check if already loaded
        if (this.rulePacks.has(name)) {
            return this.rulePacks.get(name);
        }
        try {
            const packPath = `${this.config.rulePacksDir}/${name}`;
            const content = readFileSync(packPath, 'utf-8');
            // Parse based on file extension
            let parsed;
            if (packPath.endsWith('.yaml') || packPath.endsWith('.yml')) {
                parsed = parseYaml(content);
            }
            else if (packPath.endsWith('.json')) {
                parsed = JSON.parse(content);
            }
            else {
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
            const rulePack = {
                name,
                version: parsed.version || '1.0.0',
                content: parsed,
                signature,
                loaded_at: new Date()
            };
            this.rulePacks.set(name, rulePack);
            return rulePack;
        }
        catch (error) {
            throw new Error(`Failed to load rule pack ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Calculate SHA-256 signature for content
     */
    calculateSignature(content) {
        return createHash('sha256').update(content).digest('hex');
    }
    /**
     * Get loaded rule pack
     */
    getRulePack(name) {
        return this.rulePacks.get(name);
    }
    /**
     * Reload policy (invalidate cache and reload)
     */
    reloadPolicy() {
        this.cache.invalidate(this.config.policyPath);
        return this.loadPolicy(false);
    }
    /**
     * Reload rule pack
     */
    reloadRulePack(name) {
        this.rulePacks.delete(name);
        return this.loadRulePack(name);
    }
    /**
     * Get all loaded rule packs
     */
    getAllRulePacks() {
        return Array.from(this.rulePacks.values());
    }
}
