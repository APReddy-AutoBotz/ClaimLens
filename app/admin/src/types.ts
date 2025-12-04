// Core data types
export interface AuditRecord {
  audit_id: string;
  ts: string;
  tenant: string;
  profile: string;
  route: string;
  item_id: string;
  item_name?: string;
  transforms: TransformExecution[];
  verdict: Verdict;
  latency_ms: number;
  degraded_mode: boolean;
  degraded_services?: string[];
  before_content?: string;
  after_content?: string;
}

export interface TransformExecution {
  name: string;
  duration_ms: number;
  decision: 'pass' | 'modify' | 'flag';
  metadata?: Record<string, any>;
}

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

export interface DashboardMetrics {
  total_audits: number;
  flagged_items: number;
  avg_processing_time: number;
  recent_audits: AuditRecord[];
  degraded_services: string[];
}

export interface Profile {
  name: string;
  routes: Route[];
}

export interface Route {
  path: string;
  transforms: string[];
  thresholds: Record<string, number>;
  latency_budget_ms: number;
}

export interface RulePack {
  name: string;
  version: string;
  content: string;
  updated_at: string;
  updated_by: string;
}

export interface Fixture {
  name: string;
  path: string;
  type: 'menu' | 'site';
}

export interface FixtureResult {
  fixture: string;
  flags: number;
  warnings: number;
  errors: number;
  p50_latency: number;
  p95_latency: number;
  audit_pack_url?: string;
}

export interface AugmentLiteFields {
  context: string;
  constraints: string;
  selfCritique: string;
  confirm: boolean;
}

export interface RiskProfile {
  action: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxAutonomy: number;
  requiresApproval: boolean;
}

// Enhanced types for Decision Cockpit

export interface EnhancedAuditRecord extends AuditRecord {
  severity: 'low' | 'medium' | 'high';
  tags: Array<'banned_claim' | 'allergen' | 'recall' | 'pii'>;
  pack_version: string;
}

export interface PublishReadiness {
  status: 'ready' | 'needs_review' | 'block';
  drivers: Array<{
    label: string;
    count: number;
    type: 'success' | 'warning' | 'danger';
  }>;
}

export interface ComplianceRisk {
  level: 'low' | 'medium' | 'high';
  score: number; // 0-100
  drivers: Array<{
    type: string;
    count: number;
  }>;
}

export interface SLOHealth {
  p95_latency_ms: number;
  latency_budget_ms: number;
  error_rate: number; // 0-1
  circuit_breaker_state: 'closed' | 'open' | 'half_open';
}

export interface TopViolations {
  banned_claims: number;
  allergens: number;
  recalls: number;
  pii: number;
}

export interface SparklineData {
  publish_readiness: number[]; // 7 days
  compliance_risk: number[]; // 7 days
  slo_latency: number[]; // 7 days
  total_violations: number[]; // 7 days
}

export interface EnhancedDashboardMetrics extends DashboardMetrics {
  publish_readiness: PublishReadiness;
  compliance_risk: ComplianceRisk;
  slo_health: SLOHealth;
  top_violations: TopViolations;
  sparkline_data: SparklineData;
  policy_pack_version: string;
  last_updated: string; // ISO timestamp
  recent_audits: EnhancedAuditRecord[];
}

export interface PolicyChangeRequest {
  id: string;
  timestamp: string;
  operator: string;
  context: string;
  constraints: string;
  self_critique: string;
  impact_preview: {
    affected_rules: string[];
    risk_level: 'low' | 'medium' | 'high';
    estimated_impact: string;
    confidence: number; // 0-1
  };
  status: 'pending' | 'approved' | 'rejected';
}

export interface FilterState {
  timeRange: '24h' | '7d' | '30d';
  policyProfile: string;
  tenant?: string;
}

export interface DemoAuditItem {
  id: string;
  productName: string;
  verdict: 'allow' | 'modify' | 'avoid';
  severity: 'low' | 'medium' | 'high';
  tags: string[];
  profile: string;
  tenant: string;
  timestamp: number;
}
