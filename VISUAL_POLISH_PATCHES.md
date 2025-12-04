# 🎨 Visual Polish — Copy-Paste Patches

## Patch 1: Grain Texture Overlay

**File:** `app/consumer/src/index.css`

**Add at the end of the file:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Grain Texture
   ============================================ */

/* Subtle grain overlay for premium feel */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.03" /></svg>');
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
}

@media (prefers-reduced-motion: reduce) {
  body::before {
    display: none;
  }
}
```

---

## Patch 2: Enhanced Glass Effects

**File:** `app/consumer/src/kiroween-theme.css`

**Find and replace the `.glass-surface` section:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Enhanced Glass
   ============================================ */

.glass-surface {
  background: rgba(15, 22, 40, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(248, 250, 252, 0.12);
  border-radius: 16px;
  transition: all 180ms ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.glass-surface:hover {
  border-color: rgba(20, 184, 166, 0.3);
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.15);
  transform: translateY(-1px);
}

.glass-surface:focus-within {
  border-color: rgba(20, 184, 166, 0.5);
  box-shadow: 0 0 24px rgba(20, 184, 166, 0.25);
  outline: 2px solid transparent;
}

@media (prefers-reduced-motion: reduce) {
  .glass-surface {
    transition: none;
  }
  
  .glass-surface:hover {
    transform: none;
  }
}
```

---

## Patch 3: Verdict Banner Animations

**File:** `app/consumer/src/components/VerdictBanner.module.css`

**Add at the end of the file:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Verdict Animations
   ============================================ */

/* Allow verdict - calm teal glow */
.banner[data-verdict="allow"] {
  animation: calmGlow 3s ease-in-out infinite;
}

@keyframes calmGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
  }
}

/* Modify verdict - ember pulse */
.banner[data-verdict="modify"] {
  animation: emberPulse 2s ease-in-out infinite;
}

@keyframes emberPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 35px rgba(245, 158, 11, 0.5);
  }
}

/* Avoid verdict - danger halo */
.banner[data-verdict="avoid"] {
  animation: dangerHalo 1.5s ease-in-out infinite;
}

@keyframes dangerHalo {
  0%, 100% {
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(239, 68, 68, 0.6);
  }
}

/* Disable animations for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .banner[data-verdict="allow"],
  .banner[data-verdict="modify"],
  .banner[data-verdict="avoid"] {
    animation: none;
  }
}
```

**Also update the banner element to include data attribute:**

In `VerdictBanner.tsx`, find the main banner div and add:
```tsx
<div 
  className={styles.banner} 
  data-verdict={verdict}  // ADD THIS LINE
  role="status"
>
```

---

## Patch 4: Score Count-Up Animation

**File:** `app/consumer/src/components/TrustScoreDisplay.tsx`

**Add these imports at the top:**
```typescript
import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
```

**Add this hook inside the component (before the return statement):**

```typescript
const [displayScore, setDisplayScore] = useState(0);
const prefersReducedMotion = useReducedMotion();
const animationRef = useRef<number>();

useEffect(() => {
  // Skip animation if reduced motion preferred
  if (prefersReducedMotion) {
    setDisplayScore(score);
    return;
  }

  // Animate score from 0 to final value
  const duration = 800; // ms
  const startTime = Date.now();
  const startScore = 0;
  const endScore = score;

  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out quad
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    const currentScore = Math.round(startScore + (endScore - startScore) * easeProgress);

    setDisplayScore(currentScore);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  animationRef.current = requestAnimationFrame(animate);

  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, [score, prefersReducedMotion]);
```

**Replace `{score}` with `{displayScore}` in the JSX:**

Find where the score is displayed and change:
```tsx
{/* OLD */}
<span className={styles.scoreValue}>{score}</span>

{/* NEW */}
<span className={styles.scoreValue}>{displayScore}</span>
```

---

## Patch 5: Spectral Section Styling

**File:** `app/consumer/src/pages/ScanHub.module.css`

**Add at the end of the file:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Spectral Section
   ============================================ */

.spectralSection {
  margin: 24px 0;
  animation: fadeInUp 300ms ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spectralSection {
    animation: none;
  }
}
```

---

## Patch 6: Focus Ring Enhancement

**File:** `app/consumer/src/accessibility.css`

**Add or update focus styles:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Focus Indicators
   ============================================ */

/* Enhanced focus rings for all interactive elements */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-teal, #14B8A6);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.2);
  transition: box-shadow 180ms ease;
}

/* Stronger focus for primary actions */
button.primary:focus-visible,
.scanButton:focus-visible {
  outline: 3px solid var(--color-teal, #14B8A6);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.3);
}

/* Remove default focus outline (we're replacing it) */
*:focus {
  outline: none;
}

/* But keep it for non-visible focus (keyboard nav) */
*:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Patch 7: Loading State Polish

**File:** `app/consumer/src/components/ScanProgress.module.css`

**Add enhanced loading animation:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Loading States
   ============================================ */

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(20, 184, 166, 0.2);
  border-top-color: var(--color-teal, #14B8A6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Pulsing glow effect */
.spinner::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(20, 184, 166, 0.2) 0%,
    transparent 70%
  );
  animation: pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: var(--color-teal, #14B8A6);
  }
  
  .spinner::after {
    animation: none;
  }
}
```

---

## Patch 8: Hover State Enhancements

**File:** `app/consumer/src/components/IssuesList.module.css`

**Add enhanced hover states:**

```css
/* ============================================
   KIROWEEN VISUAL POLISH: Hover States
   ============================================ */

.issue {
  transition: all 180ms ease;
  position: relative;
}

.issue::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(20, 184, 166, 0.05),
    transparent
  );
  opacity: 0;
  transition: opacity 180ms ease;
}

.issue:hover::before {
  opacity: 1;
}

.issue:hover {
  transform: translateX(4px);
  border-color: rgba(20, 184, 166, 0.3);
  box-shadow: -4px 0 0 0 rgba(20, 184, 166, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .issue {
    transition: none;
  }
  
  .issue:hover {
    transform: none;
  }
  
  .issue::before {
    transition: none;
  }
}
```

---

## Quick Apply Instructions

### For Each Patch:
1. Open the specified file in VS Code
2. Navigate to the indicated location
3. Copy-paste the code block
4. Save the file
5. Check browser for visual changes

### Testing Checklist:
- ⬜ Grain texture visible (very subtle)
- ⬜ Glass surfaces blur stronger on hover
- ⬜ Verdict banners have animated glows
- ⬜ Score counts up from 0 to final value
- ⬜ Focus rings visible and teal-colored
- ⬜ Loading spinners have glow effect
- ⬜ Hover states show smooth transitions
- ⬜ All animations respect reduced motion

### Reduced Motion Testing:
```javascript
// In browser console, test reduced motion:
matchMedia('(prefers-reduced-motion: reduce)').matches
// Should return false normally, true when enabled

// Enable in browser:
// Chrome: DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion
// Firefox: about:config > ui.prefersReducedMotion = 1
// Safari: System Preferences > Accessibility > Display > Reduce motion
```

---

## Expected Visual Impact

### Before:
- Flat, basic UI
- No texture or depth
- Static elements
- Basic focus indicators

### After:
- Premium feel with subtle grain
- Depth with enhanced glass blur
- Animated verdict banners (pulsing glows)
- Smooth score count-up
- Strong, visible focus rings
- Polished hover states
- Professional loading states

**This is the "haunted but premium" aesthetic judges will remember.** 🎨✨
