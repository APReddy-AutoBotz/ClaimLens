# Admin UI Uplift (Lite) - Spec Summary

## Overview

This spec transforms the ClaimLens Admin dashboard from a basic metrics view into a "Decision Cockpit" optimized for Kiroween judging. The focus is on high-impact visual and functional improvements that demonstrate quality, design excellence, and practical value.

## Scope

### In Scope
✅ Filter Bar with time range, policy profile, tenant, pack version, degraded mode badge
✅ Decision Cockpit with 4 SLO + Risk cards (Publish Readiness, Compliance Risk, SLO Health, Top Violations)
✅ 7-day sparklines on all cards (lightweight SVG, no chart libraries)
✅ Action Queue table with severity, tags, profile, pack version, route, operator
✅ Clickable tag filters (Banned Claim, Allergen, Recall, PII)
✅ Row actions: View Receipts, Preview Rewrite
✅ Bulk selection and export
✅ Augment-Lite Policy Change modal (Context/Constraints/Critique)
✅ Impact preview for policy changes
✅ Premium visual polish (glassmorphism, typography, spacing)
✅ Full WCAG AA accessibility

### Out of Scope
❌ Full alerts panel
❌ Real-time WebSocket updates
❌ Advanced filtering (date ranges, multi-select)
❌ Export to PDF/Excel
❌ Mobile responsive design
❌ Multi-language support

## Key Features

### 1. Filter Bar
- Time Range: 24h / 7d / 30d
- Policy Profile selector
- Optional Tenant selector
- Policy Pack Version display
- Last Updated timestamp
- Degraded Mode badge (when applicable)

### 2. Decision Cockpit Cards

**Publish Readiness**
- Status: Ready / Needs Review / Block
- 2-3 driver chips (e.g., "3 items need review")
- 7-day sparkline

**Compliance Risk**
- Level: Low / Medium / High
- Top risk drivers (e.g., "Banned claims: 12")
- 7-day sparkline

**SLO Health**
- p95 latency vs budget (e.g., "245ms / 300ms")
- Error rate percentage
- Circuit breaker state
- 7-day sparkline

**Top Violations Today**
- Counts by type: Banned Claims, Allergens, Recalls, PII
- 7-day sparkline

### 3. Action Queue
- Enhanced columns: Severity, Tags, Profile, Pack Version, Route, Operator
- Clickable tag chips for filtering
- Row actions: View Receipts, Preview Rewrite
- Bulk selection and export

### 4. Augment-Lite Policy Change
- Modal with 3 required fields: Context, Constraints, Critique
- Character counters and validation
- Impact preview panel
- Audit trail recording

## Technical Approach

### Data Strategy
- Extend existing `DashboardMetrics` interface
- Add minimal mocks for new fields
- Use existing API endpoints where possible
- Compute derived metrics from existing data

### Component Strategy
- Reusable `Sparkline` component (pure SVG)
- Reusable `CockpitCard` base component
- Modular `FilterBar` component
- Enhanced `ActionQueue` table component
- New `PolicyChangeModal` component

### Performance
- Lightweight SVG sparklines (no chart libraries)
- Memoized calculations
- Client-side filtering for tags
- Debounced API calls (300ms)
- Sub-200ms render time for cards

### Accessibility
- Visible focus indicators (2px teal, 2px offset)
- WCAG AA contrast (4.5:1 for text, 3:1 for UI)
- Minimum 44x44px touch targets
- Keyboard navigation for all features
- Screen reader support with aria-live regions
- Respects prefers-reduced-motion

## Implementation Plan

### Phase 1: Foundation (Tasks 1-3)
1. Enhanced data types and API mocks
2. Sparkline component
3. FilterBar component

### Phase 2: Core Features (Tasks 4-6)
4. Decision Cockpit cards
5. Action Queue enhancements
6. Policy Change Modal

### Phase 3: Integration (Tasks 7-10)
7. Dashboard page updates
8. Visual polish and accessibility
9. Receipts drawer
10. Preview Rewrite modal

### Phase 4: Testing (Task 11)
11. Final checkpoint - all tests pass

## Success Metrics

- ✅ Dashboard loads in <2 seconds
- ✅ All WCAG AA accessibility checks pass
- ✅ Existing tests continue to pass
- ✅ New UI behaviors have test coverage
- ✅ Demo can be narrated in <3 minutes
- ✅ Kiroween vibe is subtle and professional

## Demo Narrative

**Minute 1**: Decision Cockpit overview - show 4 cards with sparklines, explain at-a-glance insights

**Minute 2**: Action Queue - demonstrate tag filtering, row actions, bulk export

**Minute 3**: Augment-Lite - walk through policy change request with Context/Constraints/Critique, show impact preview

## Files to Create/Modify

### New Files
- `app/admin/src/components/Sparkline.tsx`
- `app/admin/src/components/FilterBar.tsx`
- `app/admin/src/components/CockpitCard.tsx`
- `app/admin/src/components/PublishReadinessCard.tsx`
- `app/admin/src/components/ComplianceRiskCard.tsx`
- `app/admin/src/components/SLOHealthCard.tsx`
- `app/admin/src/components/TopViolationsCard.tsx`
- `app/admin/src/components/ActionQueue.tsx`
- `app/admin/src/components/PolicyChangeModal.tsx`
- `app/admin/src/components/ReceiptsDrawer.tsx`
- `app/admin/src/components/PreviewRewriteModal.tsx`

### Modified Files
- `app/admin/src/types.ts` - Add enhanced interfaces
- `app/admin/src/api.ts` - Add mock data generation
- `app/admin/src/pages/Dashboard.tsx` - Integrate new components
- `app/admin/src/design-tokens.css` - Refine tokens if needed
- `app/admin/src/components.css` - Add new component styles

### Test Files
- `app/admin/src/__tests__/Sparkline.spec.tsx`
- `app/admin/src/__tests__/FilterBar.spec.tsx`
- `app/admin/src/__tests__/CockpitCard.spec.tsx`
- `app/admin/src/__tests__/ActionQueue.spec.tsx`
- `app/admin/src/__tests__/PolicyChangeModal.spec.tsx`
- Update `app/admin/src/__tests__/Dashboard.spec.tsx`

## Kiroween Vibe

Subtle touches in microcopy:
- Empty state: "The ledger is clear... for now."
- Degraded mode: "Guardian operating in safe mode"
- Policy change success: "Change request logged in the ledger"
- No violations: "All quiet on the policy front"
- Loading: "Consulting the ledger..."

Professional, not goofy. Midnight/audit ledger theme.

## Next Steps

1. Review and approve this spec
2. Begin implementation with Task 1 (data types and mocks)
3. Build components incrementally (Tasks 2-6)
4. Integrate into Dashboard (Task 7)
5. Polish and test (Tasks 8-11)
6. Prepare demo narrative

---

**Spec Status**: ✅ Complete and ready for implementation
**Estimated Effort**: 11 tasks (6 core + 5 optional tests)
**Target Demo**: 3-minute walkthrough for Kiroween judging

