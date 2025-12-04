# Steering — ClaimLens Go: Kiroween Consumer UI Theme

## Theme: Haunted Lens

A premium, spooky-but-classy aesthetic that builds trust through evidence and proof-first design.

## Color Palette

### Primary Colors
- **Spectral Teal** `#14B8A6` - Primary actions, food-safe vibes
- **Spectral Mint** `#2DD4BF` - Hover states, highlights
- **Ember Orange** `#F59E0B` - Warnings, caution states
- **Ember Glow** `#FBBF24` - Warning hover, emphasis
- **Violet Policy** `#8B5CF6` - Policy/admin accents
- **Violet Light** `#A78BFA` - Violet hover states

### Foundation
- **Ink** `#0B1220` - Background
- **Surface** `#0F1628` - Cards, elevated surfaces
- **Cloud** `#F8FAFC` - Primary text

### Status Colors
- **Allow/Safe** `#10B981` - Green, positive outcomes
- **Modify/Caution** `#F59E0B` - Amber, needs attention
- **Avoid/Danger** `#EF4444` - Red, policy violations

## Visual Effects

### Glassmorphism
```css
background: rgba(15, 22, 40, 0.55);
backdrop-filter: blur(12px);
border: 1px solid rgba(248, 250, 252, 0.1);
```

### Subtle Grain
- Opacity: 0.03
- Applied to body::before
- Disabled for prefers-reduced-motion

### Fog Gradients
- Soft vignette effect
- Radial gradient from center
- Disabled for prefers-reduced-motion

### Glow Effects
- Teal glow: `0 0 20px rgba(20, 184, 166, 0.3)`
- Ember glow: `0 0 20px rgba(245, 158, 11, 0.3)`
- Use sparingly on focus and hover states

## Typography

### Hierarchy
- **H1**: 2.25rem (36px), bold, gradient text
- **H2**: 1.5rem (24px), semibold
- **H3**: 1.125rem (18px), semibold
- **Body**: 1rem (16px), normal
- **Small**: 0.875rem (14px), normal
- **Micro**: 0.75rem (12px), medium

### Readability
- Minimum body text: 16px
- Line height: 1.5 for body, 1.2 for headings
- Never use text smaller than 12px

## Microcopy Guidelines

### Verdict Microcopy (Kiroween Flavor)
| Verdict | Microcopy |
|---------|-----------|
| Allow | "Marked safe… for now." |
| Modify | "Proceed with caution." |
| Avoid | "Do not invite this into your body." |

### Key Phrases
- **Receipts header**: "No tricks. Just proof."
- **Privacy note**: "Processed locally by default. Saved only if you choose."
- **Alternatives disclaimer**: "Suggestions may not match all preferences… Always check labels."
- **Trust anchors**: "No account required", "Receipts included"

### Tone Rules
1. **Spooky but classy** - Subtle Halloween flavor, never cheap
2. **Proof-first** - Lead with evidence, not claims
3. **Non-alarmist** - Factual, not fear-mongering
4. **Compliance language** - "policy violation" not "dangerous"

### What We Say vs. Don't Say
| ❌ Don't Say | ✅ Do Say |
|-------------|----------|
| "This product is dangerous" | "Policy violation detected" |
| "Medical advice" | "Based on claim policy + allergen profile" |
| "Guaranteed safe" | "No policy violations found in checks we ran" |
| "Lab tested" | "Evidence-based scoring" |
| "Toxic" | "Contains flagged ingredients" |

## Animation Guidelines

### Spectral Scan Animation
- Subtle pulsing glow effect
- Duration: 1.5s per cycle
- Easing: ease-in-out
- **Must respect prefers-reduced-motion**

### Transitions
- Fast: 120ms (micro-interactions)
- Base: 180ms (standard transitions)
- Slow: 300ms (drawer open/close)

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility Requirements

### Color Contrast
- Body text: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio

### Focus Indicators
- Visible focus ring on all interactive elements
- Focus ring: `2px solid var(--color-teal)`
- Focus offset: 2px

### Non-Color Indicators
- Always pair color with icon or text
- Status badges include icons, not just color
- Error states have text descriptions

## Component Patterns

### Cards
- Glass surface background
- 16px border radius
- 1px border with glass-border color
- Subtle shadow on hover

### Buttons
- Primary: Spectral teal background
- Secondary: Ghost style with teal border
- Minimum touch target: 44x44px

### Badges
- Rounded pill shape
- Icon + text combination
- Color-coded by severity

## Compliance Checklist

Before shipping any consumer UI change:
- [ ] Color contrast verified (4.5:1 minimum)
- [ ] Focus indicators visible on all interactive elements
- [ ] Reduced motion preference respected
- [ ] No medical/diagnosis language used
- [ ] "Why" explanation present for each warning
- [ ] Source link present when available
- [ ] Touch targets minimum 44x44px
