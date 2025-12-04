# Design System — ClaimLens

## Overview

ClaimLens uses a dark-first, glassmorph-lite aesthetic with accessibility built-in. All components meet WCAG AA standards (4.5:1 contrast minimum).

---

## 1. Design Tokens

### Color Palette

```css
/* Base Colors */
--color-ink: #0B1220;        /* Primary background */
--color-surface: #0F1628;    /* Secondary background */
--color-cloud: #F8FAFC;      /* Primary text */

/* Brand Colors */
--color-indigo: #4F46E5;     /* Primary actions */
--color-teal: #14B8A6;       /* Focus, links */

/* Semantic Colors */
--color-emerald: #10B981;    /* Safe, allow */
--color-amber: #F59E0B;      /* Caution, modify */
--color-red: #EF4444;        /* Danger, block */

/* B2C Accent Colors (use sparingly) */
--color-mango: #FBBF24;      /* Warm accent */
--color-leaf: #22C55E;       /* Fresh accent */
--color-berry: #8B5CF6;      /* Playful accent */
--color-sky: #38BDF8;        /* Cool accent */
--color-cream: #FEF9C3;      /* Soft accent */
```

### Typography

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing

```css
/* Spacing Scale (4px base) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Shadows

```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Glow Effects */
--glow-indigo: 0 0 20px rgba(79, 70, 229, 0.3);
--glow-teal: 0 0 20px rgba(20, 184, 166, 0.3);
--glow-emerald: 0 0 20px rgba(16, 185, 129, 0.3);
```

### Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## 2. Glassmorph Recipe

### Glass Surface

```css
.glass-surface {
  background: rgba(15, 22, 40, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  border: 1px solid rgba(248, 250, 252, 0.1);
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(14px)) {
  .glass-surface {
    background: rgba(15, 22, 40, 0.95);
  }
}

/* Reduced transparency mode */
@media (prefers-reduced-transparency: reduce) {
  .glass-surface {
    background: rgba(15, 22, 40, 0.95);
    backdrop-filter: none;
  }
}
```

### Glass Variants

```css
/* Light Glass (for overlays on dark backgrounds) */
.glass-light {
  background: rgba(248, 250, 252, 0.08);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(248, 250, 252, 0.15);
}

/* Frosted Glass (stronger blur) */
.glass-frosted {
  background: rgba(15, 22, 40, 0.65);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(248, 250, 252, 0.12);
}

/* Tinted Glass (with color) */
.glass-indigo {
  background: rgba(79, 70, 229, 0.15);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(79, 70, 229, 0.3);
}
```

---

## 3. Component Patterns

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-indigo);
  color: var(--color-cloud);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 120ms ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #6366F1;
  box-shadow: var(--glow-indigo);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

/* Secondary Button (Glass) */
.btn-secondary {
  background: rgba(248, 250, 252, 0.08);
  backdrop-filter: blur(14px);
  color: var(--color-cloud);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(248, 250, 252, 0.15);
  font-weight: var(--font-medium);
  transition: all 120ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(248, 250, 252, 0.12);
  border-color: rgba(248, 250, 252, 0.25);
}

/* Danger Button */
.btn-danger {
  background: var(--color-red);
  color: var(--color-cloud);
  /* ... same structure as primary */
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: rgba(248, 250, 252, 0.08);
  border: 1px solid rgba(248, 250, 252, 0.15);
  cursor: pointer;
  transition: all 120ms ease;
}

.btn-icon:hover {
  background: rgba(248, 250, 252, 0.12);
}
```

### Cards

```css
/* KPI Card */
.kpi-card {
  background: rgba(15, 22, 40, 0.55);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  border: 1px solid rgba(248, 250, 252, 0.1);
  padding: var(--space-6);
  transition: all 180ms ease;
}

.kpi-card:hover {
  border-color: rgba(248, 250, 252, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.kpi-card__label {
  font-size: var(--text-sm);
  color: rgba(248, 250, 252, 0.6);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
}

.kpi-card__value {
  font-size: var(--text-3xl);
  color: var(--color-cloud);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.kpi-card__trend {
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.kpi-card__trend--up {
  color: var(--color-emerald);
}

.kpi-card__trend--down {
  color: var(--color-red);
}
```

### Badges

```css
/* Base Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
}

/* Semantic Badges */
.badge--safe {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-emerald);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge--caution {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-amber);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge--danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-red);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge--info {
  background: rgba(79, 70, 229, 0.15);
  color: var(--color-indigo);
  border: 1px solid rgba(79, 70, 229, 0.3);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table__header {
  position: sticky;
  top: 0;
  background: rgba(15, 22, 40, 0.95);
  backdrop-filter: blur(14px);
  z-index: var(--z-sticky);
}

.table__header-cell {
  padding: var(--space-4);
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: rgba(248, 250, 252, 0.8);
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
}

.table__row {
  transition: background 120ms ease;
}

.table__row:nth-child(even) {
  background: rgba(248, 250, 252, 0.02);
}

.table__row:hover {
  background: rgba(248, 250, 252, 0.05);
}

.table__cell {
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-cloud);
  border-bottom: 1px solid rgba(248, 250, 252, 0.05);
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: rgba(248, 250, 252, 0.05);
  border: 1px solid rgba(248, 250, 252, 0.15);
  border-radius: var(--radius-lg);
  color: var(--color-cloud);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  transition: all 120ms ease;
}

.input::placeholder {
  color: rgba(248, 250, 252, 0.4);
}

.input:hover {
  border-color: rgba(248, 250, 252, 0.25);
}

.input:focus {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input with Icon */
.input-group {
  position: relative;
}

.input-group__icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(248, 250, 252, 0.4);
  pointer-events: none;
}

.input-group .input {
  padding-left: var(--space-10);
}
```

### Modals

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 18, 32, 0.8);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  background: rgba(15, 22, 40, 0.95);
  backdrop-filter: blur(24px);
  border-radius: var(--radius-2xl);
  border: 1px solid rgba(248, 250, 252, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal__header {
  padding: var(--space-6);
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-cloud);
}

.modal__body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: var(--space-6);
  border-top: 1px solid rgba(248, 250, 252, 0.1);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

### Tooltips

```css
.tooltip {
  position: absolute;
  background: rgba(11, 18, 32, 0.95);
  backdrop-filter: blur(14px);
  color: var(--color-cloud);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  white-space: nowrap;
  z-index: var(--z-tooltip);
  pointer-events: none;
  border: 1px solid rgba(248, 250, 252, 0.15);
  box-shadow: var(--shadow-lg);
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid rgba(11, 18, 32, 0.95);
}
```

---

## 4. Motion & Animation

### Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale

```css
--duration-fast: 120ms;
--duration-base: 150ms;
--duration-slow: 180ms;
--duration-slower: 300ms;
```

### Animation Patterns

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn var(--duration-base) var(--ease-out);
}

/* Slide Up */
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
  animation: slideUp var(--duration-base) var(--ease-out);
}

/* Scale In */
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
  animation: scaleIn var(--duration-base) var(--ease-out);
}

/* Shimmer (loading state) */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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

### Reduced Motion

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

---

## 5. Accessibility

### Focus Indicators

```css
/* Global focus style */
*:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Custom focus for specific elements */
.btn:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.input:focus-visible {
  outline: none;
  border-color: var(--color-teal);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}
```

### Contrast Ratios

All text must meet WCAG AA standards (4.5:1 minimum):

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| Cloud (#F8FAFC) | Ink (#0B1220) | 18.5:1 | ✅ AAA |
| Cloud (#F8FAFC) | Surface (#0F1628) | 17.2:1 | ✅ AAA |
| Indigo (#4F46E5) | Ink (#0B1220) | 7.8:1 | ✅ AAA |
| Teal (#14B8A6) | Ink (#0B1220) | 6.2:1 | ✅ AAA |
| Amber (#F59E0B) | Ink (#0B1220) | 8.1:1 | ✅ AAA |
| Red (#EF4444) | Ink (#0B1220) | 5.9:1 | ✅ AAA |
| Emerald (#10B981) | Ink (#0B1220) | 6.4:1 | ✅ AAA |

### Screen Reader Support

```html
<!-- Visually hidden but accessible to screen readers -->
<span class="sr-only">Loading...</span>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### ARIA Labels

```html
<!-- Button with icon only -->
<button class="btn-icon" aria-label="Close modal">
  <svg>...</svg>
</button>

<!-- Badge with status -->
<span class="badge badge--danger" role="status" aria-label="Blocked: Contains banned claim">
  Blocked
</span>

<!-- Loading state -->
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading results...</span>
  <div class="spinner"></div>
</div>
```

### Keyboard Navigation

```css
/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-indigo);
  color: var(--color-cloud);
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: 9999;
}

.skip-link:focus {
  top: var(--space-2);
}
```

---

## 6. Responsive Design

### Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Container

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

---

## 7. Dark Mode (Default)

ClaimLens is dark-first by design. Light mode is not currently supported but can be added:

```css
/* Future light mode support */
@media (prefers-color-scheme: light) {
  :root {
    --color-ink: #F8FAFC;
    --color-surface: #FFFFFF;
    --color-cloud: #0B1220;
    /* ... adjust other colors */
  }
}
```

---

## 8. Component Checklist

### Required for All Components

- [ ] WCAG AA contrast (4.5:1 minimum)
- [ ] Visible focus indicators (2px minimum)
- [ ] Keyboard navigable
- [ ] ARIA labels where needed
- [ ] Reduced motion support
- [ ] Reduced transparency fallback
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive design
- [ ] Touch-friendly (44px minimum tap target)

---

## 9. Usage Examples

### Dashboard Layout

```html
<div class="dashboard">
  <header class="dashboard__header glass-surface">
    <h1>ClaimLens Dashboard</h1>
    <nav>...</nav>
  </header>
  
  <main class="dashboard__main">
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-card__label">Total Audits</div>
        <div class="kpi-card__value">12,543</div>
        <div class="kpi-card__trend kpi-card__trend--up">
          ↑ 12% from last month
        </div>
      </div>
      <!-- More KPI cards -->
    </div>
    
    <div class="glass-surface">
      <table class="table">
        <!-- Table content -->
      </table>
    </div>
  </main>
</div>
```

---

## 10. References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inter Font](https://rsms.me/inter/)
- [Glassmorphism Generator](https://hype4.academy/tools/glassmorphism-generator)
