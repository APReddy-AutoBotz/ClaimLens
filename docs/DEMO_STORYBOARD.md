# Demo Storyboard — ClaimLens (180 seconds)

## Setup (0:00 - 0:15)
"ClaimLens prevents misleading food claims and allergen incidents. Let me show you both our B2B and B2C solutions in action."

**Screen:** VS Code with ClaimLens project open
**Action:** Point to folder structure, highlight `.kiro` directory

## Beat 1: Raw Menu → Flags (0:15 - 0:45)
"First, MenuShield - our B2B pre-publish gate for cloud kitchens."

**Screen:** Terminal running `curl -X POST /api/analyze`
**Action:** 
- Show raw menu JSON with problematic items
- Submit to API: item with "superfood smoothie" and undeclared nuts
- Display flagged results with specific reasons

**Key Points:**
- "Superfood" flagged as banned marketing term
- Nut allergen detected but not declared
- Nutrition units normalized to per-100g standard

## Beat 2: One-Click Clean → Audit Pack (0:45 - 1:15)
"Kitchen operators get actionable fixes, not just problems."

**Screen:** Web interface showing flagged items
**Action:**
- Click "Apply Suggestions" button
- Show before/after: "superfood" → "nutrient-rich" + disclaimer
- Allergen warning added to item description
- Display audit trail with reasoning

**Key Points:**
- Suggestions based on audit packs (banned claims, disclaimers)
- Each change includes "why" explanation with source link
- Maintains factual tone, avoids alarmist language

## Beat 3: Vibe Coding Moment (1:15 - 1:35)
"Let's add a new transform for sodium warnings."

**Screen:** VS Code editor
**Action:**
- Open `packages/transforms/`
- Create `highlight.sodium.ts` with threshold check
- Write simple test case
- Run `pnpm test` - passes immediately

**Key Points:**
- Pure functions, easy to test
- Follows steering rules (factual, measurable)
- Integrates seamlessly with existing pipeline

## Beat 4: Augment-Lite Policy Gate (1:35 - 1:50)
"Policy changes go through critique validation."

**Screen:** Policy editor interface
**Action:**
- Modify sodium threshold in `packs/nutrition.thresholds.yaml`
- System shows impact preview: "Will affect 23% of current items"
- Approve change, see it propagate to transform pipeline

**Key Points:**
- Safe policy editing with impact analysis
- No blind rule changes
- Immediate feedback loop

## Beat 5: Degraded Mode Toggle (1:50 - 2:05)
"External services can fail gracefully."

**Screen:** MCP service dashboard
**Action:**
- Show OCR service status: "Connected"
- Toggle to "Degraded Mode" 
- Rerun analysis - still works, but with local fallbacks
- Show log: "OCR unavailable, using text-only analysis"

**Key Points:**
- System resilience built-in
- Clear user communication about reduced functionality
- No complete failures

## Beat 6: B2C Overlay (2:05 - 2:25)
"Now ClaimLens Go - our consumer browser extension."

**Screen:** Food delivery website (Swiggy/Zomato fixture)
**Action:**
- Load page with extension active
- Allergen badges appear on menu items
- Click badge: tooltip shows "Contains nuts - why: detected in ingredient list"
- Navigate with keyboard - focus rings visible

**Key Points:**
- Real-time analysis without breaking site
- WCAG AA compliant (contrast, keyboard nav)
- Privacy-first (no data transmission)

## Beat 7: Kiro Receipts (2:25 - 3:00)
"Everything is governed by our development workflow."

**Screen:** VS Code with `.kiro` folder expanded
**Action:**
- Show `specs/policies.yaml` - the source of truth
- Open `steering/style.md` - development guidelines
- Display `hooks/` - automated governance
- Run `pnpm test && pnpm check:budgets` - all green

**Key Points:**
- Spec-driven development with Kiro
- Automated compliance checking
- Performance budgets enforced in CI
- Complete audit trail from requirements to code

**Closing:** "ClaimLens: making food information trustworthy, accessible, and legally compliant - powered by deterministic rules and human oversight."