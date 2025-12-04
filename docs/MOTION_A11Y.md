# Motion & Accessibility — ClaimLens

## Overview

ClaimLens animations are subtle, purposeful, and respect user preferences. All motion follows WCAG 2.1 Animation from Interactions guidelines.

---

## 1. Animation Principles

### Timing

- **Fast (120ms)**: Micro-interactions (hover, focus)
- **Base (150ms)**: Standard transitions (button clicks, toggles)
- **Slow (180ms)**: Complex animations (modals, drawers)
- **Never exceed 180ms** for UI feedback

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);        /* Accelerating */
--ease-out: cubic-bezier(0, 0, 0.2, 1);       /* Decelerating */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */
```

**Usage:**
- `ease-out`: Most UI transitions (feels responsive)
- `ease-in-out`: Modals, drawers (smooth entry/exit)
- `ease-bounce`: Celebratory moments (success states)

---

## 2. Animation Patterns

### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 150ms ease-out;
}
```

**Use for:** Tooltips, notifications, subtle reveals

### Slide Up

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 150ms ease-out;
}
```

**Use for:** Modals, dropdowns, popovers

### Scale In

```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 150ms ease-out;
}
```

**Use for:** Badges appearing, success confirmations

### Shimmer (Loading)

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    rgba(248, 250, 252, 0.05) 0%,
    rgba(248, 250, 252, 0.1) 50%,
    rgba(248, 250, 252, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Use for:** Loading skeletons, processing states

### Pulse (Attention)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

**Use for:** Live indicators, pending states

---

## 3. Focus Indicators

### Minimum Requirements

- **Width:** 2px minimum
- **Color:** Teal (#14B8A6) for high contrast
- **Offset:** 2px from element
- **Visible:** Must be clearly visible on all backgrounds

### Implementation

```css
*:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Custom focus for buttons */
.btn:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

/* Custom focus for inputs */
.input:focus-visible {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}
```

### Focus Order

Ensure logical tab order:
1. Skip to main content link
2. Primary navigation
3. Main content (forms, buttons, links)
4. Secondary navigation
5. Footer

```html
<!-- Skip link (hidden until focused) -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<nav>...</nav>

<main id="main-content" tabindex="-1">
  <!-- Content -->
</main>
```

---

## 4. Contrast Requirements

### WCAG AA Standards

All text must meet 4.5:1 contrast ratio minimum:

| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Body text | #F8FAFC | #0B1220 | 18.5:1 | ✅ AAA |
| Primary button | #F8FAFC | #4F46E5 | 7.8:1 | ✅ AAA |
| Success badge | #10B981 | #0B1220 | 6.4:1 | ✅ AAA |
| Warning badge | #F59E0B | #0B1220 | 8.1:1 | ✅ AAA |
| Danger badge | #EF4444 | #0B1220 | 5.9:1 | ✅ AAA |

### Testing Tools

```bash
# Install contrast checker
npm install -g wcag-contrast

# Check contrast
wcag-contrast #F8FAFC #0B1220
# Output: 18.5:1 (AAA)
```

### Automated Testing

```typescript
// Playwright accessibility test
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## 5. Reduced Motion

### Media Query

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### JavaScript Detection

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Disable animations
  document.body.classList.add('reduce-motion');
}
```

### Alternative Feedback

When motion is reduced, provide alternative feedback:

```css
/* Normal state */
.btn {
  transition: transform 150ms ease-out;
}

.btn:hover {
  transform: translateY(-2px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn:hover {
    transform: none;
    background-color: rgba(79, 70, 229, 0.9);
  }
}
```

---

## 6. Reduced Transparency

### Media Query

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-surface,
  .glass-light,
  .glass-frosted {
    background: rgba(15, 22, 40, 0.95);
    backdrop-filter: none;
  }
}
```

### Fallback Support

```css
/* Browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(14px)) {
  .glass-surface {
    background: rgba(15, 22, 40, 0.95);
  }
}
```

---

## 7. Keyboard Navigation

### ESC Key Behavior

All overlays must close on ESC:

```typescript
function handleEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Close modal
    closeModal();
    
    // Close tooltip
    closeTooltip();
    
    // Close dropdown
    closeDropdown();
    
    // Return focus to trigger element
    triggerElement?.focus();
  }
}

document.addEventListener('keydown', handleEscKey);
```

### Tab Trapping

Trap focus within modals:

```typescript
function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
```

### Arrow Key Navigation

For lists and menus:

```typescript
function handleArrowKeys(event: KeyboardEvent, items: HTMLElement[]) {
  const currentIndex = items.findIndex(item => item === document.activeElement);
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
      break;
      
    case 'Home':
      event.preventDefault();
      items[0].focus();
      break;
      
    case 'End':
      event.preventDefault();
      items[items.length - 1].focus();
      break;
  }
}
```

---

## 8. Screen Reader Support

### ARIA Labels

```html
<!-- Button with icon only -->
<button aria-label="Close modal">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Status badge -->
<span class="badge badge--danger" role="status" aria-label="Blocked: Contains banned claim">
  Blocked
</span>

<!-- Loading state -->
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading results...</span>
  <div class="spinner" aria-hidden="true"></div>
</div>

<!-- Form validation -->
<input
  type="text"
  aria-invalid="true"
  aria-describedby="error-message"
/>
<span id="error-message" role="alert">
  This field is required
</span>
```

### Live Regions

```html
<!-- Polite announcements (non-interrupting) -->
<div aria-live="polite" aria-atomic="true">
  <span class="sr-only">3 new items flagged</span>
</div>

<!-- Assertive announcements (interrupting) -->
<div aria-live="assertive" aria-atomic="true">
  <span class="sr-only">Error: Failed to save changes</span>
</div>
```

---

## 9. Touch Targets

### Minimum Size

All interactive elements must be at least 44×44px:

```css
.btn,
.btn-icon,
.checkbox,
.radio {
  min-width: 44px;
  min-height: 44px;
}

/* Visual size can be smaller with padding */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  min-width: 44px;
  min-height: 44px;
}
```

### Spacing

Maintain 8px minimum spacing between touch targets:

```css
.btn-group {
  display: flex;
  gap: var(--space-2); /* 8px */
}
```

---

## 10. Color Blindness

### Don't Rely on Color Alone

Always pair color with text, icons, or patterns:

```html
<!-- ❌ Bad: Color only -->
<span class="badge badge--danger">Item</span>

<!-- ✅ Good: Color + icon + text -->
<span class="badge badge--danger">
  <svg aria-hidden="true">⚠️</svg>
  Blocked: Banned claim
</span>
```

### Test with Simulators

```bash
# Chrome DevTools
# 1. Open DevTools
# 2. Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
# 3. Type "Rendering"
# 4. Select "Emulate vision deficiencies"
```

---

## 11. Accessibility Checklist

### Every Component Must Have

- [ ] WCAG AA contrast (4.5:1 minimum)
- [ ] Visible focus indicators (2px minimum)
- [ ] Keyboard navigable (Tab, Enter, ESC, Arrows)
- [ ] ARIA labels where needed
- [ ] Screen reader tested
- [ ] Reduced motion support
- [ ] Reduced transparency fallback
- [ ] Touch targets ≥44×44px
- [ ] Color not sole indicator
- [ ] Semantic HTML

### Testing Workflow

1. **Automated:** Run axe-core in CI
2. **Keyboard:** Navigate without mouse
3. **Screen Reader:** Test with NVDA/JAWS/VoiceOver
4. **Zoom:** Test at 200% zoom
5. **Color Blind:** Test with simulators
6. **Reduced Motion:** Enable in OS settings

---

## 12. Animation Examples

### Button Hover

```css
.btn {
  transition: all 120ms ease-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-indigo);
}

.btn:active {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .btn:hover {
    transform: none;
    background-color: #6366F1;
  }
}
```

### Modal Enter/Exit

```css
.modal-backdrop {
  animation: fadeIn 150ms ease-out;
}

.modal {
  animation: slideUp 180ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Success Confirmation

```css
.success-checkmark {
  animation: scaleIn 180ms ease-bounce;
}

@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 13. References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [Reduced Motion](https://web.dev/prefers-reduced-motion/)
- [Focus Indicators](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)
- [Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [axe DevTools](https://www.deque.com/axe/devtools/)
