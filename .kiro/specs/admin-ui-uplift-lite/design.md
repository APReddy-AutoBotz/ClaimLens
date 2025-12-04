# Design Document: Admin UI Uplift (Lite)

## Overview

This design transforms the ClaimLens Admin dashboard from a basic metrics display into a Decision Cockpit that enables operators to quickly assess system health, identify compliance risks, and take action. The design prioritizes at-a-glance readability, actionable insights, and premium visual polish while maintaining fast performance and accessibility.

## Architecture

### Component Hierarchy

```
Dashboard (Page)
├── FilterBar (New)
│   ├── TimeRangeSelector
│   ├── PolicyProfileSelector
│   ├── TenantSelector (optional)
│   └── SystemStatusBadge
├── DecisionCockpit (New - replaces KPI cards)
│   ├── PublishReadinessCard
│   ├── ComplianceRiskCard
│   ├── SLOHealthCard
│   └── TopViolationsCard
├── ActionQueue (Enhanced - replaces Recent Audits)
│   ├── TableFilters
│   ├── AuditTable
│   │   ├── SeverityColumn
│   │   ├── TagChips
│   │   └── RowActions
│   └── BulkActions
└── PolicyChangeModal (New)
    ├── AugmentLiteForm
    └── ImpactPreview
```

### Data Flow

1. **Dashboard Load**: Fetch metrics from `/v1/admin/dashboard` with time range and profile filters
2. **Filter Change**: Re-fetch metrics with new parameters, update all cards and sparklines
3. **Tag Filter**: Client-side filtering of audit records by tag type
4. **Policy Change**: POST to `/v1/admin/policy-changes` with augment-lite fields, receive impact preview
5. **Receipts View**: Navigate to `/audits/{id}` or open drawer with audit details

### State Management

```typescript
interface DashboardState {
  // Filters
  timeRange: '24h' | '7d' | '30d';
  policyProfile: string;
  tenant?: string;
  
  // Data
  metrics: EnhancedDashboardMetrics | null;
  loading: boolean;
  error: string | null;
  
  // UI State
  selectedTags: string[];
  showPolicyModal: boolean;
  selectedAudit: string | null;
}

interface EnhancedDashboardMetrics extends DashboardMetrics {
  // New fields
  publish_readiness: PublishReadiness;
  compliance_risk: ComplianceRisk;
  slo_health: SLOHealth;
  top_violations: ViolationCounts;
  sparkline_data: SparklineData;
  policy_pack_version: string;
  last_updated: string;
}
```

## Components and Interfaces

### 1. FilterBar Component

**Purpose**: Provide top-level filtering and system status display

**Props**:
```typescript
interface FilterBarProps {
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  policyProfile: string;
  onPolicyProfileChange: (profile: string) => void;
  tenant?: string;
  onTenantChange?: (tenant: string) => void;
  degradedMode: boolean;
  degradedServices: string[];
  policyPackVersion: string;
  lastUpdated: string;
}
```

**Visual Design**:
- Glassmorphism card with subtle border
- Horizontal layout with filters on left, status badges on right
- Degraded mode badge: Amber background, warning icon
- Pack version: Small text with version number
- Last updated: Relative time (e.g., "Updated 5m ago")

**Accessibility**:
- All selects have visible labels
- Focus indicators: 2px teal outline with 2px offset
- Degraded mode badge has role="status" and aria-live="polite"

### 2. Decision Cockpit Cards

**Shared Card Structure**:
```typescript
interface CockpitCardProps {
  title: string;
  primaryMetric: {
    value: string | number;
    label: string;
    status: 'success' | 'warning' | 'danger';
  };
  drivers: Array<{
    label: string;
    value: string;
    type: 'success' | 'warning' | 'danger';
  }>;
  sparklineData: number[];
  sparklineLabel: string;
}
```

**Card 1: Publish Readiness**
- Status: Ready (green) / Needs Review (amber) / Block (red)
- Drivers: "3 items need review", "2 policy violations", "1 recall match"
- Sparkline: 7-day trend of blocked items
- Icon: ✓ / ⚠ / ✕

**Card 2: Compliance Risk**
- Level: Low (green) / Medium (amber) / High (red)
- Drivers: "Banned claims: 12", "Allergen risks: 3", "Missing disclaimers: 5"
- Sparkline: 7-day trend of risk score
- Icon: 🛡️

**Card 3: SLO Health**
- Primary: p95 latency vs budget (e.g., "245ms / 300ms")
- Secondary: Error rate (e.g., "0.2%"), Circuit breaker state (Open/Closed)
- Sparkline: 7-day p95 latency trend
- Icon: ⚡

**Card 4: Top Violations Today**
- Counts: Banned Claims (15), Allergens (8), Recalls (2), PII (1)
- Sparkline: 7-day total violations trend
- Icon: 🚨

**Visual Design**:
- 4-column grid on desktop
- Glassmorphism background with gradient border
- Large primary metric (32px font)
- Driver chips: Small pills with icon + text
- Sparkline: 60px height, 7 data points, smooth curve

### 3. Sparkline Component

**Purpose**: Lightweight 7-day trend visualization

**Props**:
```typescript
interface SparklineProps {
  data: number[]; // 7 data points
  width?: number; // default 120
  height?: number; // default 40
  color?: string; // default teal
  showDots?: boolean; // default false
}
```

**Implementation**:
- Pure SVG, no chart libraries
- Smooth curve using quadratic bezier
- Gradient fill from color to transparent
- Responsive to container width
- Accessible: aria-label with trend description

**SVG Structure**:
```svg
<svg viewBox="0 0 120 40" aria-label="7-day trend: increasing">
  <defs>
    <linearGradient id="gradient">
      <stop offset="0%" stop-color="teal" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="teal" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M..." fill="url(#gradient)" />
  <path d="M..." stroke="teal" fill="none" stroke-width="2" />
</svg>
```

### 4. Action Queue Table

**Purpose**: Enhanced audit table with filtering and actions

**Columns**:
1. Severity: Icon (🔴 High, 🟡 Medium, 🟢 Low)
2. Trigger Tags: Clickable chips
3. Policy Profile: Text
4. Pack Version: Text (e.g., "v2.1.0")
5. Route: Text (e.g., "/v1/menu/feed")
6. Operator: Text (tenant name)
7. Timestamp: Relative time
8. Item Name: Text with truncation
9. Verdict: Badge (Allow/Modify/Block)
10. Latency: Number with "ms" suffix
11. Actions: Icon buttons

**Tag Chips**:
```typescript
interface TagChip {
  type: 'banned_claim' | 'allergen' | 'recall' | 'pii';
  label: string;
  active: boolean;
  onClick: () => void;
}
```

**Visual Design**:
- Chips: Small pills with icon, hover effect, active state
- Active chip: Teal background, white text
- Inactive chip: Transparent background, teal border
- Row hover: Subtle background highlight
- Actions: Icon-only buttons (👁️ View, 📝 Preview)

**Row Actions**:
- View Receipts: Opens drawer with audit trail
- Preview Rewrite: Opens modal with before/after comparison
- Bulk Export: Exports selected rows as JSON

### 5. Policy Change Modal

**Purpose**: Augment-Lite policy change request flow

**Form Fields**:
```typescript
interface PolicyChangeForm {
  context: string; // Required, multiline, 200 char min
  constraints: string; // Required, multiline, 100 char min
  selfCritique: string; // Required, multiline, 100 char min
}
```

**Visual Design**:
- Large modal (800px width)
- Three textarea fields with character counters
- Impact preview panel below form
- Submit button disabled until all fields valid
- Glassmorphism background with border

**Impact Preview**:
- Affected rules: List of rule IDs
- Risk level: Low/Med/High badge
- Estimated impact: "~50 items affected"
- Confidence: Percentage (e.g., "85% confidence")

**Validation**:
- Context: Min 200 chars, max 2000 chars
- Constraints: Min 100 chars, max 1000 chars
- Critique: Min 100 chars, max 1000 chars
- Real-time character count
- Error messages below fields

## Data Models

### Enhanced Dashboard Metrics

```typescript
interface EnhancedDashboardMetrics {
  // Existing fields
  total_audits: number;
  flagged_items: number;
  avg_processing_time: number;
  recent_audits: EnhancedAuditRecord[];
  degraded_services: string[];
  
  // New fields
  publish_readiness: {
    status: 'ready' | 'needs_review' | 'block';
    drivers: Array<{ label: string; count: number; type: string }>;
  };
  
  compliance_risk: {
    level: 'low' | 'medium' | 'high';
    score: number; // 0-100
    drivers: Array<{ type: string; count: number }>;
  };
  
  slo_health: {
    p95_latency_ms: number;
    latency_budget_ms: number;
    error_rate: number; // 0-1
    circuit_breaker_state: 'closed' | 'open' | 'half_open';
  };
  
  top_violations: {
    banned_claims: number;
    allergens: number;
    recalls: number;
    pii: number;
  };
  
  sparkline_data: {
    publish_readiness: number[]; // 7 days
    compliance_risk: number[]; // 7 days
    slo_latency: number[]; // 7 days
    total_violations: number[]; // 7 days
  };
  
  policy_pack_version: string;
  last_updated: string; // ISO timestamp
}

interface EnhancedAuditRecord extends AuditRecord {
  severity: 'low' | 'medium' | 'high';
  tags: Array<'banned_claim' | 'allergen' | 'recall' | 'pii'>;
  pack_version: string;
}
```

### Policy Change Request

```typescript
interface PolicyChangeRequest {
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
```

## Error Handling

### Loading States
- Skeleton loaders for cards (shimmer effect)
- Spinner for table data
- Disabled state for filters during load

### Empty States
- No audits: "No audits found for this time range. Try expanding your filters."
- No violations: "All clear! No violations detected in this period."
- No policy changes: "No policy change requests yet."

### Error States
- API error: Red banner with retry button
- Degraded mode: Amber banner with affected services
- Validation error: Inline error message below field

### Degraded Mode
- Banner at top of dashboard
- Affected services listed
- Link to degraded mode documentation
- Cards show "Limited data" indicator if affected

## Testing Strategy

### Unit Tests
- FilterBar: Time range selection, profile selection
- Sparkline: Data normalization, SVG path generation
- PolicyChangeModal: Form validation, character counting
- ActionQueue: Tag filtering, bulk selection

### Integration Tests
- Dashboard: Load with filters, refresh on filter change
- ActionQueue: Click tag chip, filter table
- PolicyChangeModal: Submit form, show impact preview

### Accessibility Tests
- Focus indicators visible on all interactive elements
- Keyboard navigation works for all controls
- Screen reader announces status changes
- Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
- Touch targets meet 44x44px minimum

### Visual Regression Tests
- Dashboard layout at 1920x1080
- Card layouts with different data states
- Modal appearance and positioning
- Table with various row counts

## Performance Considerations

- Sparklines: Memoize SVG path calculation
- Table: Virtualize if >100 rows (not in initial scope)
- Filters: Debounce API calls by 300ms
- Animations: Use CSS transforms, respect prefers-reduced-motion
- Bundle size: No new heavy dependencies

## Accessibility Checklist

- [ ] All interactive elements have visible focus indicators (2px teal outline, 2px offset)
- [ ] Text contrast meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Touch targets are minimum 44x44px
- [ ] Form fields have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Status changes use aria-live regions
- [ ] Keyboard navigation works for all features
- [ ] Skip links provided for main content areas
- [ ] Animations respect prefers-reduced-motion
- [ ] Color is not the only indicator of status

## Kiroween Vibe

Subtle touches to maintain the midnight/audit ledger theme:

- Empty state copy: "The ledger is clear... for now."
- Degraded mode: "Guardian operating in safe mode"
- Policy change success: "Change request logged in the ledger"
- No violations: "All quiet on the policy front"
- Loading: "Consulting the ledger..."

Keep it professional - no horror gimmicks, just subtle nods to the theme.

