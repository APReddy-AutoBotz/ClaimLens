/**
 * ClaimLens Core Package
 * Exports core types, interfaces, and utilities
 */

// Type exports
export type {
  MenuItem,
  NormalizedMenuItem,
  Verdict,
  Change,
  Reason,
  TransformContext,
  TransformResult,
  TransformFunction,
  Flag,
  AuditRecord,
  TransformExecution,
  MCPServiceRegistry,
  MCPService,
  Badge
} from './types.js';

// Pipeline exports
export {
  TransformPipeline,
  TransformRegistry
} from './pipeline.js';

export type {
  Policy,
  Profile,
  Route,
  PipelineMetrics
} from './pipeline.js';

// Policy Loader exports
export {
  PolicyLoader,
  PolicyCache
} from './policy-loader.js';

export type {
  RulePack,
  PolicyLoaderConfig
} from './policy-loader.js';

// Function exports
export {
  normalizeIngredients,
  normalizeMenuItem
} from './normalize.js';

// Trust Score exports
export {
  calculateTrustScore,
  getVerdict
} from './trust-score.js';

export type {
  TrustScoreInput,
  TrustScoreBreakdown,
  TrustScoreResult,
  Verdict as TrustVerdict
} from './trust-score.js';

// Safer Swaps exports
export {
  generateSuggestions
} from './safer-swaps.js';

export type {
  SaferSwapSuggestion
} from './safer-swaps.js';

// Audit Manager exports
export {
  AuditManager
} from './audit-manager.js';

export type {
  AuditManagerConfig,
  AuditStorageBackend,
  AuditQueryFilters,
  AuditContext,
  AuditSnapshot
} from './audit-manager.js';

// Audit Pack Generator exports
export {
  AuditPackGenerator
} from './audit-pack-generator.js';

export type {
  AuditPackOptions,
  AuditPackSummary
} from './audit-pack-generator.js';

// Audit Storage exports
export {
  InMemoryAuditStorage
} from './audit-storage-memory.js';

export {
  TimescaleAuditStorage
} from './audit-storage-timescale.js';

export type {
  TimescaleDBConfig
} from './audit-storage-timescale.js';

// Tenant and RBAC exports
export type {
  Tenant,
  TenantConfig,
  User,
  UserSession,
  ApiKey,
  PolicyChangeLog,
  Permission
} from './tenant-models.js';

export {
  Role,
  ROLE_PERMISSIONS,
  checkPermission,
  hasRole,
  isAdmin
} from './tenant-models.js';

// Auth Service exports
export {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  hashToken,
  createSession,
  isSessionExpired,
  isSessionInactive,
  generateMFASecret,
  verifyTOTP,
  generateMFAQRCodeURL
} from './auth-service.js';

export type {
  JWTPayload
} from './auth-service.js';

// User Repository exports
export {
  UserRepository
} from './user-repository.js';

// Policy Change Logger exports
export {
  PolicyChangeLogger,
  validateAugmentLiteFields
} from './policy-change-logger.js';

export type {
  AugmentLiteFields,
  PolicyChange
} from './policy-change-logger.js';

// Circuit Breaker exports
export {
  CircuitBreaker,
  CircuitState
} from './circuit-breaker.js';

export type {
  CircuitBreakerConfig,
  CircuitBreakerStats
} from './circuit-breaker.js';

// MCP Service Manager exports
export {
  MCPServiceManager
} from './mcp-service-manager.js';

export type {
  MCPServiceDefinition,
  MCPRegistry,
  DegradedModeConfig,
  DegradedModeMatrix,
  ServiceHealth
} from './mcp-service-manager.js';

// Augment-Lite Gate exports
export {
  AugmentLiteGate,
  RISK_PROFILES
} from './augment-lite-gate.js';

export type {
  RiskLevel,
  RiskProfile,
  AugmentLiteFields as AugmentLiteGateFields,
  ValidationResult
} from './augment-lite-gate.js';

// Policy Versioning exports
export {
  PolicyVersioningManager,
  parseVersion,
  formatVersion,
  incrementVersion,
  generateDiff,
  formatDiff
} from './policy-versioning.js';

export type {
  SemanticVersion,
  PolicyVersionRecord,
  PolicyDiff
} from './policy-versioning.js';

// Staged Rollout exports
export {
  StagedRolloutManager
} from './staged-rollout.js';

export type {
  RolloutStage,
  RolloutConfig,
  RolloutMetrics,
  RolloutDecision
} from './staged-rollout.js';

// Dashboard Metrics exports
export {
  DashboardMetricsCalculator
} from './dashboard-metrics.js';

export type {
  DashboardKPIs,
  RecentAudit
} from './dashboard-metrics.js';

// Fixtures Runner exports
export {
  FixturesRunner
} from './fixtures-runner.js';

export type {
  FixtureResult,
  FixtureRunSummary
} from './fixtures-runner.js';

// Logger exports
export {
  Logger,
  logger,
  createLogger
} from './logger.js';

export type {
  LogLevel,
  LogEntry,
  LoggerConfig
} from './logger.js';

// Metrics exports
export {
  Counter,
  Histogram,
  Gauge,
  MetricsRegistry,
  registry,
  metrics
} from './metrics.js';

export type {
  MetricLabels
} from './metrics.js';

// SLO Tracker exports
export {
  SLOTracker,
  sloTracker,
  defaultSLOs
} from './slo-tracker.js';

export type {
  SLO,
  SLOStatus,
  SLOConfig
} from './slo-tracker.js';

// Webhook Manager exports
export {
  WebhookManager
} from './webhook-manager.js';

export type {
  WebhookPayload,
  WebhookDeliveryRecord,
  WebhookConfig
} from './webhook-manager.js';

// Input Sanitizer exports
export {
  sanitizeText,
  sanitizeHTML,
  validateInputLength,
  sanitizeMenuItem
} from './input-sanitizer.js';

// SSRF Defense exports
export {
  validateMCPUrl,
  addAllowedHost,
  getAllowedHosts,
  safeFetch
} from './ssrf-defense.js';

// Secrets Manager exports
export {
  generateTenantKey,
  loadTenantKey,
  encryptPII,
  decryptPII,
  hashWebhookSecret,
  verifyWebhookSecret,
  generateWebhookSignature,
  verifyWebhookSignature,
  rotateTenantKey,
  clearAllKeys,
  KEY_ROTATION_POLICY
} from './secrets-manager.js';
