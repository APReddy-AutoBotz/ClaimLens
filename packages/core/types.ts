/**
 * ClaimLens Core Types
 * Type definitions for MenuItem, Verdict, Transform interfaces
 */

// ============================================================================
// MenuItem and Related Types
// ============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  ingredients?: string | string[]; // Accepts both formats for backward compatibility
  nutrition?: {
    calories?: string | number;
    sugar_g?: number;
    sodium_mg?: number;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

export interface NormalizedMenuItem extends Omit<MenuItem, 'ingredients'> {
  ingredients: string[]; // Always normalized to array
}

// ============================================================================
// Verdict and Related Types
// ============================================================================

export interface Verdict {
  verdict: 'allow' | 'modify' | 'block';
  changes: Change[];
  reasons: Reason[];
  audit_id: string;
  correlation_id: string;
}

export interface Change {
  field: string;
  before: string;
  after: string;
}

export interface Reason {
  transform: string;
  why: string;
  source?: string;
}

// ============================================================================
// Transform Pipeline Types
// ============================================================================

export interface TransformContext {
  locale: string;
  tenant: string;
  correlationId: string;
  mcpServices?: MCPServiceRegistry;
}

export interface TransformResult {
  text: string;
  modified: boolean;
  flags: Flag[];
  metadata?: Record<string, any>;
}

export interface Flag {
  kind: 'warn' | 'danger' | 'ok';
  label: string;
  explanation: string;
  source?: string;
}

export type TransformFunction = (
  input: string,
  context: TransformContext
) => TransformResult | Promise<TransformResult>;

// ============================================================================
// Audit Record Types
// ============================================================================

export interface AuditRecord {
  audit_id: string;
  ts: string; // ISO 8601
  tenant: string;
  profile: string;
  route: string;
  item_id: string;
  transforms: TransformExecution[];
  verdict: Verdict;
  latency_ms: number;
  degraded_mode: boolean;
  degraded_services?: string[];
}

export interface TransformExecution {
  name: string;
  duration_ms: number;
  decision: 'pass' | 'modify' | 'flag';
  metadata?: Record<string, any>;
}

// ============================================================================
// MCP Service Types
// ============================================================================

export interface MCPServiceRegistry {
  [serviceName: string]: MCPService;
}

export interface MCPService {
  name: string;
  url: string;
  timeout: number;
  critical: boolean;
}

// ============================================================================
// Badge Types (for ClaimLens Go)
// ============================================================================

export interface Badge {
  kind: 'warn' | 'danger' | 'ok';
  label: string;
  explanation: string;
  source?: string;
  item_id?: string;
}

// ============================================================================
// Re-export tenant models
// ============================================================================

export * from './tenant-models';
