# Screenshots Checklist - B2C & Admin Final Polish

This checklist documents the key screenshots needed to demonstrate the B2C & Admin Final Polish features for Kiroween judging.

## B2C Consumer App Screenshots

### 1. History Page with Real Product Names
**Location:** `/history`

**What to Capture:**
- [ ] Multiple scan items showing real product names (not "Scanned Product")
- [ ] Product names like "Organic Almond Milk", "Grass-Fed Beef Jerky", etc.
- [ ] Brand and category metadata displayed under product names
- [ ] Source type icons (🌐 url, 📸 screenshot, 📊 barcode, 📝 text)
- [ ] Source labels (e.g., "amazon.com", "Barcode Scan")
- [ ] Trust scores and verdict badges
- [ ] Timestamps showing "Just now", "5m ago", etc.

**Key Features to Highlight:**
- Real product names replace generic placeholders
- Rich metadata (brand, category, source)
- Professional, polished display

**Screenshot Filename:** `history-real-product-names.png`

---

### 2. History Page with "Unknown Item" and Rename
**Location:** `/history`

**What to Capture:**
- [ ] At least one item showing "Unknown Item" text
- [ ] Rename button (✏️ Rename) visible next to "Unknown Item"
- [ ] Rename button in hover state (if possible)

**Key Features to Highlight:**
- Graceful fallback for missing product names
- User can rename unknown items
- Rename button only appears for unknown items

**Screenshot Filename:** `history-unknown-item-rename.png`

---

### 3. Results Page with Product Header
**Location:** `/results` (after scanning)

**What to Capture:**
- [ ] Large product name at top of page
- [ ] Brand and category displayed below name (if available)
- [ ] Source chip with icon and label (e.g., "🌐 Web URL")
- [ ] Optional Rename button (if "Unknown Item")
- [ ] Trust Score Display below Product Header
- [ ] Verdict Banner
- [ ] Full dashboard layout

**Key Features to Highlight:**
- Prominent Product Header component
- Clear product identification
- Source type clearly indicated
- Professional hierarchy

**Screenshot Filename:** `results-product-header.png`

---

### 4. Visual Polish - Enhanced Glass Depth
**Location:** Any page with glass surfaces (Results, History, Settings)

**What to Capture:**
- [ ] Glass surface cards with enhanced depth
- [ ] Visible backdrop blur effect
- [ ] Border and shadow stacking
- [ ] Inner highlight (subtle)
- [ ] Multiple cards showing consistent depth

**Key Features to Highlight:**
- Enhanced glassmorphism (alpha 0.65, blur 16px)
- Consistent border alpha (0.12)
- Professional depth and layering

**Screenshot Filename:** `visual-polish-glass-depth.png`

---

### 5. Visual Polish - Ghost Light Accents
**Location:** Any page with interactive elements (buttons, cards)

**What to Capture:**
- [ ] Primary buttons with teal ghost-light glow
- [ ] Policy/admin elements with violet ghost-light
- [ ] Hover states showing enhanced glow (if possible)
- [ ] Subtle, professional appearance

**Key Features to Highlight:**
- Subtle accent glow effects
- Teal for primary actions
- Violet for policy/admin
- Non-distracting, premium feel

**Screenshot Filename:** `visual-polish-ghost-light.png`

---

### 6. Visual Polish - Mist Gradient Background
**Location:** Home page or any page with visible background

**What to Capture:**
- [ ] Subtle radial gradient in background
- [ ] Very low opacity (non-distracting)
- [ ] Teal accent at top center
- [ ] Fades to transparent

**Key Features to Highlight:**
- Atmospheric background effect
- Non-distracting (opacity 0.03)
- Premium feel

**Screenshot Filename:** `visual-polish-mist-gradient.png`

---

### 7. Visual Polish - Ember Accent (Warnings)
**Location:** Results page with "Avoid" or "Caution" verdict

**What to Capture:**
- [ ] Warning/danger state with ember accent
- [ ] Border-left with ember orange color
- [ ] Subtle ember glow
- [ ] Restrained, professional appearance

**Key Features to Highlight:**
- Ember accent only on warnings
- Restrained styling
- Clear visual hierarchy

**Screenshot Filename:** `visual-polish-ember-accent.png`

---

## Admin Dashboard Screenshots

### 8. Admin Filters with Multiple Values
**Location:** `/admin/dashboard`

**What to Capture:**
- [ ] Time Range dropdown showing options (24h, 7d, 30d)
- [ ] Policy Profile dropdown showing: Default, Strict, Permissive
- [ ] Tenant dropdown showing: tenant_1, tenant_2, tenant_3
- [ ] Filter summary showing selected values
- [ ] Reset button (if filters are not default)

**Key Features to Highlight:**
- Multiple options in each dropdown (3+ options)
- Realistic tenant and profile names
- Professional filter UI

**Screenshot Filename:** `admin-filters-multiple-values.png`

---

### 9. Admin Dashboard with Empty State
**Location:** `/admin/dashboard` (before running demo audit)

**What to Capture:**
- [ ] Action Queue section with EmptyState component
- [ ] Icon (📋)
- [ ] Title: "No data yet"
- [ ] Description text
- [ ] CTA button: "▶ Run Demo Audit"
- [ ] Page is NOT blank - has title and description

**Key Features to Highlight:**
- Never renders blank
- Clear CTA to populate data
- Professional empty state design

**Screenshot Filename:** `admin-empty-state.png`

---

### 10. Admin Action Queue with Varied Verdicts
**Location:** `/admin/dashboard` (after running demo audit)

**What to Capture:**
- [ ] Multiple audit items in Action Queue
- [ ] Real product names (not placeholders)
- [ ] Mix of verdicts: allow (green), modify (yellow), avoid (red)
- [ ] Multiple tenants visible (tenant_1, tenant_2, tenant_3)
- [ ] Multiple profiles visible (Default, Strict, Permissive)
- [ ] Varied tags: banned_claim, allergen, recall, pii
- [ ] Severity indicators: 🔴 high, 🟡 medium, 🟢 low
- [ ] Pack versions displayed

**Key Features to Highlight:**
- Realistic product names
- Visual variety (verdicts, tags, severity)
- Multiple tenants and profiles
- Professional data display

**Screenshot Filename:** `admin-action-queue-varied.png`

---

### 11. Admin Audit Viewer with Empty State
**Location:** `/admin/audits`

**What to Capture:**
- [ ] EmptyState component
- [ ] Title: "No audits found"
- [ ] CTA: "Clear Filters" or similar
- [ ] Page is NOT blank

**Key Features to Highlight:**
- Consistent empty state pattern
- Clear recovery action

**Screenshot Filename:** `admin-audit-viewer-empty.png`

---

### 12. Admin Profiles Editor with Empty State
**Location:** `/admin/profiles`

**What to Capture:**
- [ ] EmptyState component
- [ ] Title: "No profiles configured"
- [ ] CTA: "Add Profile" or similar
- [ ] Page is NOT blank

**Key Features to Highlight:**
- Consistent empty state pattern
- Clear action to populate

**Screenshot Filename:** `admin-profiles-empty.png`

---

### 13. Admin Rule Packs Editor with Empty State
**Location:** `/admin/rule-packs`

**What to Capture:**
- [ ] EmptyState component
- [ ] Title: "No rule packs loaded"
- [ ] CTA: "Load Defaults" or similar
- [ ] Page is NOT blank

**Key Features to Highlight:**
- Consistent empty state pattern
- Clear action to populate

**Screenshot Filename:** `admin-rule-packs-empty.png`

---

## Accessibility Screenshots

### 14. Focus Indicators
**Location:** Any page

**What to Capture:**
- [ ] Focused button with visible teal outline
- [ ] Focused input with visible teal outline
- [ ] Focused link with visible teal outline
- [ ] 2px outline with 2px offset

**Key Features to Highlight:**
- WCAG AA compliant focus indicators
- Visible on all interactive elements
- Consistent teal color

**Screenshot Filename:** `accessibility-focus-indicators.png`

---

### 15. Reduced Motion Mode
**Location:** Any page (with prefers-reduced-motion enabled)

**What to Capture:**
- [ ] No grain overlay
- [ ] No mist gradient
- [ ] No glow effects
- [ ] No animations
- [ ] Clean, static appearance

**Key Features to Highlight:**
- Full reduced motion support
- All effects disabled
- Still professional appearance

**Screenshot Filename:** `accessibility-reduced-motion.png`

---

## Screenshot Capture Instructions

### For B2C Consumer App:
1. Start the consumer app: `cd app/consumer && npm run dev`
2. Navigate to `http://localhost:5173`
3. Use browser DevTools to set viewport to 1920x1080 for desktop screenshots
4. For mobile screenshots, use 375x812 (iPhone X)
5. Capture screenshots using browser screenshot tool or OS screenshot utility

### For Admin Dashboard:
1. Start the admin app: `cd app/admin && npm run dev`
2. Navigate to `http://localhost:5174`
3. Use browser DevTools to set viewport to 1920x1080
4. Capture screenshots using browser screenshot tool or OS screenshot utility

### For Accessibility Screenshots:
1. Enable "prefers-reduced-motion" in browser DevTools:
   - Chrome: DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion
   - Firefox: about:config > ui.prefersReducedMotion = 1
2. Use Tab key to focus elements for focus indicator screenshots
3. Capture screenshots showing focused state

### Screenshot Quality:
- Use PNG format for best quality
- Ensure text is readable
- Capture full viewport (no cropping)
- Use consistent browser and OS for all screenshots
- Disable browser extensions that might interfere with appearance

## Submission

Once all screenshots are captured:
1. Create a `screenshots/` folder in the project root
2. Save all screenshots with the filenames specified above
3. Review each screenshot to ensure it clearly demonstrates the feature
4. Create a summary document linking screenshots to requirements

