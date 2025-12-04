/**
 * Staged Rollout Manager
 * Implements traffic splitting with automatic rollback on error threshold
 */

import type { Pool } from 'pg';

// ============================================================================
// Rollout Stage
// ============================================================================

export type RolloutStage = 'initial' | 'stage_10' | 'stage_50' | 'stage_100' | 'rolled_back';

export interface RolloutConfig {
  id?: number;
  policy_version: string;
  current_stage: RolloutStage;
  traffic_percentage: number;
  started_at: Date;
  updated_at: Date;
  error_rate: number;
  total_requests: number;
  failed_requests: number;
  status: 'active' | 'completed' | 'rolled_back';
}

// ============================================================================
// Rollout Metrics
// ============================================================================

export interface RolloutMetrics {
  stage: RolloutStage;
  trafficPercentage: number;
  totalRequests: number;
  failedRequests: number;
  errorRate: number;
  duration: number; // milliseconds
}

// ============================================================================
// Rollout Decision
// ============================================================================

export interface RolloutDecision {
  shouldProceed: boolean;
  nextStage?: RolloutStage;
  reason: string;
  metrics: RolloutMetrics;
}

// ============================================================================
// Staged Rollout Manager
// ============================================================================

export class StagedRolloutManager {
  private readonly ERROR_THRESHOLD = 0.05; // 5% error rate triggers rollback
  private readonly STAGE_PROGRESSION = [
    { stage: 'initial' as RolloutStage, traffic: 0 },
    { stage: 'stage_10' as RolloutStage, traffic: 10 },
    { stage: 'stage_50' as RolloutStage, traffic: 50 },
    { stage: 'stage_100' as RolloutStage, traffic: 100 },
  ];

  constructor(private pool: Pool) {}

  /**
   * Initialize rollout tracking table
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS policy_rollouts (
        id SERIAL PRIMARY KEY,
        policy_version VARCHAR(20) NOT NULL,
        current_stage VARCHAR(20) NOT NULL,
        traffic_percentage INTEGER NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        error_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
        total_requests INTEGER NOT NULL DEFAULT 0,
        failed_requests INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        UNIQUE(policy_version)
      );

      CREATE INDEX IF NOT EXISTS idx_policy_rollouts_status 
        ON policy_rollouts(status, updated_at DESC);

      CREATE TABLE IF NOT EXISTS rollout_logs (
        id SERIAL PRIMARY KEY,
        rollout_id INTEGER NOT NULL REFERENCES policy_rollouts(id),
        stage VARCHAR(20) NOT NULL,
        traffic_percentage INTEGER NOT NULL,
        error_rate DECIMAL(5,4) NOT NULL,
        decision VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  /**
   * Start a new rollout
   */
  async startRollout(policyVersion: string): Promise<RolloutConfig> {
    const result = await this.pool.query(
      `INSERT INTO policy_rollouts 
       (policy_version, current_stage, traffic_percentage, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [policyVersion, 'initial', 0, 'active']
    );

    const config = result.rows[0] as RolloutConfig;

    await this.logRolloutDecision(
      config.id!,
      'initial',
      0,
      0,
      'started',
      'Rollout initiated'
    );

    return config;
  }

  /**
   * Get active rollout
   */
  async getActiveRollout(): Promise<RolloutConfig | null> {
    const result = await this.pool.query(
      `SELECT * FROM policy_rollouts 
       WHERE status = 'active' 
       ORDER BY started_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as RolloutConfig;
  }

  /**
   * Get rollout by version
   */
  async getRollout(policyVersion: string): Promise<RolloutConfig | null> {
    const result = await this.pool.query(
      `SELECT * FROM policy_rollouts WHERE policy_version = $1`,
      [policyVersion]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as RolloutConfig;
  }

  /**
   * Update rollout metrics
   */
  async updateMetrics(
    rolloutId: number,
    totalRequests: number,
    failedRequests: number
  ): Promise<void> {
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    await this.pool.query(
      `UPDATE policy_rollouts 
       SET total_requests = $1,
           failed_requests = $2,
           error_rate = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [totalRequests, failedRequests, errorRate, rolloutId]
    );
  }

  /**
   * Evaluate rollout and decide next action
   */
  async evaluateRollout(rolloutId: number): Promise<RolloutDecision> {
    const result = await this.pool.query(
      `SELECT * FROM policy_rollouts WHERE id = $1`,
      [rolloutId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Rollout ${rolloutId} not found`);
    }

    const config = result.rows[0] as RolloutConfig;

    const metrics: RolloutMetrics = {
      stage: config.current_stage,
      trafficPercentage: config.traffic_percentage,
      totalRequests: config.total_requests,
      failedRequests: config.failed_requests,
      errorRate: config.error_rate,
      duration: Date.now() - new Date(config.updated_at).getTime(),
    };

    // Check error threshold
    if (config.error_rate >= this.ERROR_THRESHOLD) {
      return {
        shouldProceed: false,
        nextStage: 'rolled_back',
        reason: `Error rate ${(config.error_rate * 100).toFixed(2)}% exceeds threshold ${this.ERROR_THRESHOLD * 100}%`,
        metrics,
      };
    }

    // Check if we need minimum requests before proceeding
    const minRequests = this.getMinimumRequests(config.current_stage);
    if (config.total_requests < minRequests) {
      return {
        shouldProceed: false,
        reason: `Waiting for minimum ${minRequests} requests (current: ${config.total_requests})`,
        metrics,
      };
    }

    // Determine next stage
    const currentStageIndex = this.STAGE_PROGRESSION.findIndex(
      (s) => s.stage === config.current_stage
    );

    if (currentStageIndex === -1 || currentStageIndex >= this.STAGE_PROGRESSION.length - 1) {
      return {
        shouldProceed: false,
        reason: 'Rollout complete',
        metrics,
      };
    }

    const nextStage = this.STAGE_PROGRESSION[currentStageIndex + 1];

    return {
      shouldProceed: true,
      nextStage: nextStage.stage,
      reason: `Error rate ${(config.error_rate * 100).toFixed(2)}% is below threshold, proceeding to ${nextStage.traffic}%`,
      metrics,
    };
  }

  /**
   * Advance to next stage
   */
  async advanceStage(rolloutId: number, nextStage: RolloutStage): Promise<void> {
    const stageConfig = this.STAGE_PROGRESSION.find((s) => s.stage === nextStage);
    if (!stageConfig) {
      throw new Error(`Invalid stage: ${nextStage}`);
    }

    await this.pool.query(
      `UPDATE policy_rollouts 
       SET current_stage = $1,
           traffic_percentage = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [nextStage, stageConfig.traffic, rolloutId]
    );

    const config = await this.pool.query(
      `SELECT * FROM policy_rollouts WHERE id = $1`,
      [rolloutId]
    );

    await this.logRolloutDecision(
      rolloutId,
      nextStage,
      stageConfig.traffic,
      config.rows[0].error_rate,
      'advanced',
      `Advanced to ${stageConfig.traffic}% traffic`
    );
  }

  /**
   * Rollback to previous version
   */
  async rollback(rolloutId: number, reason: string): Promise<void> {
    await this.pool.query(
      `UPDATE policy_rollouts 
       SET current_stage = 'rolled_back',
           status = 'rolled_back',
           updated_at = NOW()
       WHERE id = $1`,
      [rolloutId]
    );

    const config = await this.pool.query(
      `SELECT * FROM policy_rollouts WHERE id = $1`,
      [rolloutId]
    );

    await this.logRolloutDecision(
      rolloutId,
      'rolled_back',
      0,
      config.rows[0].error_rate,
      'rolled_back',
      reason
    );
  }

  /**
   * Complete rollout
   */
  async completeRollout(rolloutId: number): Promise<void> {
    await this.pool.query(
      `UPDATE policy_rollouts 
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1`,
      [rolloutId]
    );

    await this.logRolloutDecision(
      rolloutId,
      'stage_100',
      100,
      0,
      'completed',
      'Rollout completed successfully'
    );
  }

  /**
   * Determine if request should use new policy version
   */
  shouldUseNewVersion(trafficPercentage: number, requestId: string): boolean {
    // Use hash of request ID to deterministically route traffic
    const hash = this.hashString(requestId);
    const bucket = hash % 100;
    return bucket < trafficPercentage;
  }

  /**
   * Get rollout logs
   */
  async getRolloutLogs(rolloutId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM rollout_logs 
       WHERE rollout_id = $1 
       ORDER BY logged_at ASC`,
      [rolloutId]
    );

    return result.rows;
  }

  /**
   * Log rollout decision
   */
  private async logRolloutDecision(
    rolloutId: number,
    stage: string,
    trafficPercentage: number,
    errorRate: number,
    decision: string,
    reason: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO rollout_logs 
       (rollout_id, stage, traffic_percentage, error_rate, decision, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rolloutId, stage, trafficPercentage, errorRate, decision, reason]
    );
  }

  /**
   * Get minimum requests required before advancing stage
   */
  private getMinimumRequests(stage: RolloutStage): number {
    switch (stage) {
      case 'initial':
        return 0;
      case 'stage_10':
        return 100; // Need 100 requests at 10% before advancing
      case 'stage_50':
        return 500; // Need 500 requests at 50% before advancing
      case 'stage_100':
        return 1000; // Need 1000 requests at 100% before completing
      default:
        return 0;
    }
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
