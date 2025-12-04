# 🎯 Where to See Each Enhancement — Visual Guide

## 🌐 Consumer App (http://localhost:3002)

### Enhancement 1: Real Product Names ✨
**Location:** History Page

**Steps to See:**
1. Open http://localhost:3002
2. Click **"✨ Try Demo"** button (orange button below URL input)
3. Wait for scan to complete (~3 seconds)
4. Click **"📜 History"** in bottom navigation bar
5. **Look for:** "Immunity Booster Juice" instead of "Unknown Item"

**What You'll See:**
```
📜 History
─────────────────────────────
🌐 Immunity Booster Juice    ← REAL NAME!
   HealthyLife • Beverages
   Score: 45
   2m ago
```

**Before:** "Unknown Item"
**After:** "Immunity Booster Juice" (extracted from demo data)

---

### Enhancement 2: Spectral Scan Animation 🔬
**Location:** Scan Page (during scanning)

**Steps to See:**
1. Open http://localhost:3002
2. Click **"✨ Try Demo"** button
3. **Watch immediately** - animation appears during scan

**What You'll See:**
```
┌─────────────────────────────────────┐
│ 🔬 Forensic Analysis                │
├─────────────────────────────────────┤
│ ✓ Allergen Detection                │
│   📋 No allergens detected          │
│                                     │
│ ⚠️ Banned Claims Check              │
│   📋 Prohibited health claim...     │
│                                     │
│ ✓ Disclaimer Verification           │
│   📋 Missing required disclaimers   │
│                                     │
│ ✓ PII Redaction                     │
│   📋 No PII detected                │
│                                     │
│ ✓ Recall Database Lookup (MCP)     │
│   📋 No recalls found               │
└─────────────────────────────────────┘
```

**Animation Details:**
- Steps appear one by one (250-450ms each)
- Teal scan line sweeps across each step
- Evidence snippets fade in
- Status icons animate (⚠️ ✓ —)

**Timing:** Appears for ~2-3 seconds during scan

---

### Enhancement 3: Score Count-Up Animation 🎯
**Location:** Results Page

**Steps to See:**
1. Open http://localhost:3002
2. Click **"✨ Try Demo"** button
3. Wait for scan to complete
4. **Watch the score** on results page

**What You'll See:**
```
Trust Score
    45      ← Counts up from 0 → 45
   / 100
```

**Animation Details:**
- Starts at 0
- Counts up smoothly to 45
- Duration: 800ms
- Easing: Ease-out quad (smooth deceleration)

**Timing:** Happens immediately when results page loads

---

### Enhancement 4: Verdict Banner Glow 💫
**Location:** Results Page

**Steps to See:**
1. Open http://localhost:3002
2. Click **"✨ Try Demo"** button
3. Wait for scan to complete
4. **Look at the verdict banner** (orange/amber colored box)

**What You'll See:**
```
┌─────────────────────────────────────┐
│ ⚠️ CAUTION                          │ ← Pulsing glow!
│                                     │
│ "Proceed with caution."             │
│                                     │
│ Multiple banned health claims...    │
└─────────────────────────────────────┘
```

**Animation Details:**
- Amber/orange pulsing halo around banner
- Glow intensity: 20px → 35px → 20px
- Duration: 2 seconds per cycle
- Continuous loop

**Colors by Verdict:**
- **Allow:** Calm teal glow (slow pulse, 3s)
- **Caution:** Ember pulse (medium, 2s)
- **Avoid:** Danger halo (fast, 1.5s)

---

### Enhancement 5: Grain Texture Overlay 🎨
**Location:** Entire App (Background)

**Steps to See:**
1. Open http://localhost:3002
2. **Look at dark backgrounds** (especially the main background)
3. Look closely - you'll see very subtle noise/grain

**What You'll See:**
- Subtle film grain texture
- Opacity: 0.03 (very subtle!)
- Gives premium "haunted" feel
- Like old film photography

**Best Viewed:**
- Dark areas of the screen
- Behind glass cards
- Main background
- May need to look closely - it's intentionally subtle!

**Tip:** If you can't see it, it's working correctly - it should be barely noticeable!

---

### Enhancement 6: Enhanced Glass Effects 🪟
**Location:** All Cards and Surfaces

**Steps to See:**
1. Open http://localhost:3002
2. **Hover over any glass card** (input areas, results cards)
3. Watch for blur and glow effects

**What You'll See:**
- Stronger backdrop blur (16px)
- Teal border glow on hover
- Smooth transitions (180ms)

**Best Examples:**
- Input method selector cards
- Results page cards
- History items

**Hover Effect:**
```
Normal:  border: 1px solid rgba(248, 250, 252, 0.12)
Hover:   border: 1px solid rgba(20, 184, 166, 0.3)
         box-shadow: 0 0 20px rgba(20, 184, 166, 0.15)
```

---

## 🎛️ Admin App (http://localhost:3000)

### Enhancement 7: MCP Health Panel 🔌
**Location:** Dashboard (Bottom)

**Steps to See:**
1. Open http://localhost:3000
2. **Scroll to the bottom** of the dashboard
3. Look for "🔌 MCP Service Health" panel

**What You'll See:**
```
┌─────────────────────────────────────────────┐
│ 🔌 MCP Service Health          [Demo Mode] │
├─────────────────────────────────────────────┤
│                                             │
│ ● OCR Label :7001          [HEALTHY]       │
│   Circuit Breaker: Closed (Normal)         │
│   Latency: 45ms                            │
│   Last Check: 2:30:15 PM                   │
│   [⚠️ Simulate Outage]                     │
│                                             │
│ ● Unit Convert :7002       [HEALTHY]       │
│   Circuit Breaker: Closed (Normal)         │
│   Latency: 12ms                            │
│                                             │
│ ● Recall Lookup :7003      [HEALTHY]       │
│   Circuit Breaker: Closed (Normal)         │
│   Latency: 89ms                            │
│   📊 Fallback used in last 10 audits: 2    │
│                                             │
│ ● Alt Suggester :7004      [HEALTHY]       │
│   Circuit Breaker: Closed (Normal)         │
│   Latency: 156ms                           │
│   📊 Fallback used in last 10 audits: 1    │
└─────────────────────────────────────────────┘
```

**Interactive Demo:**
1. Click **"⚠️ Simulate Outage"** on any service
2. Watch status change to **[DOWN]** (red)
3. Circuit breaker shows **"Open (Failing)"**
4. Fallback strategy appears:
   ```
   Fallback: pass-through (skip OCR, use text-only analysis)
   ```

**Status Colors:**
- 🟢 Green = Healthy
- 🟡 Amber = Degraded
- 🔴 Red = Down

---

## 🎬 Quick Demo Flow (2 Minutes)

### Step 1: Consumer App (90 seconds)
```
1. Open http://localhost:3002
2. Click "✨ Try Demo"
3. WATCH: Spectral Scan animation (2-3 seconds)
4. WATCH: Score count-up (0 → 45)
5. SEE: Verdict banner glowing
6. LOOK: Grain texture on dark areas
7. Click "📜 History"
8. SEE: "Immunity Booster Juice" (real name!)
```

### Step 2: Admin App (30 seconds)
```
1. Open http://localhost:3000
2. Scroll to bottom
3. SEE: MCP Health Panel
4. Click "Simulate Outage"
5. WATCH: Circuit breaker change
```

---

## 🔍 Troubleshooting: "I Don't See It!"

### Spectral Scan Not Showing?
- **Make sure:** You clicked "Try Demo" (not manual scan)
- **Watch carefully:** Animation lasts only 2-3 seconds
- **Check:** Browser console for errors (F12)

### Score Not Counting Up?
- **Check:** Browser has "prefers-reduced-motion" disabled
- **Try:** Hard refresh (Ctrl+Shift+R)
- **Note:** Animation is 800ms - blink and you'll miss it!

### Grain Texture Not Visible?
- **It's subtle!** Opacity is only 0.03
- **Look at:** Very dark areas
- **Try:** Adjusting monitor brightness
- **Note:** If you barely see it, it's working!

### Verdict Banner Not Glowing?
- **Check:** You're on the Results page (not Scan page)
- **Look for:** Pulsing effect around the banner edges
- **Try:** Looking in a dark room (easier to see glow)
- **Check:** Browser supports backdrop-filter

### MCP Panel Not Showing?
- **Scroll down!** It's at the bottom of the dashboard
- **Check:** Admin app is running (http://localhost:3000)
- **Try:** Hard refresh (Ctrl+Shift+R)

---

## 📸 Screenshot Checklist

For your demo video/submission, capture these moments:

### Consumer App Screenshots:
- [ ] Spectral Scan animation (mid-animation)
- [ ] Score counting up (capture at 20-30)
- [ ] Verdict banner with glow
- [ ] History showing "Immunity Booster Juice"
- [ ] Grain texture (zoom in on dark area)

### Admin App Screenshots:
- [ ] MCP Health Panel (all services healthy)
- [ ] MCP Health Panel (one service down)
- [ ] Circuit breaker state change

---

## 🎯 What Judges Will See

### Technical Depth:
- **Spectral Scan:** "They can SEE the transform pipeline!"
- **MCP Health:** "Circuit breakers are VISIBLE!"
- **Real Names:** "Smart extraction from multiple sources!"

### Visual Polish:
- **Grain Texture:** "Premium, haunted aesthetic"
- **Glass Effects:** "Professional, not amateur"
- **Animations:** "Smooth, accessible, polished"

### Kiro Showcase:
- **Specs:** Generated architecture
- **Hooks:** Enforced governance
- **Steering:** Theme consistency
- **MCP:** Extensibility with fallbacks

---

## 💡 Pro Tips

1. **Record in Dark Mode:** Grain texture and glows show better
2. **Slow Motion:** Record at 60fps, play at 0.5x for animations
3. **Zoom In:** Show grain texture up close
4. **Side-by-Side:** Show before/after (History with/without real names)
5. **Narrate:** Explain what's happening as you demo

---

**Ready to see the magic? Open http://localhost:3002 and click "Try Demo"!** ✨
