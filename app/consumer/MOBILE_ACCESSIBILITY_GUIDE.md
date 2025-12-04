# Mobile & Accessibility Quick Reference

## Mobile Optimizations

### Code Splitting
All routes are lazy-loaded for optimal performance:
```typescript
const ScanHub = lazy(() => import('./pages/ScanHub'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
```

### Lazy Image Loading
Use the LazyImage component for optimized image loading:
```typescript
import LazyImage from '@components/LazyImage';

<LazyImage 
  src="/path/to/image.jpg" 
  alt="Description"
  placeholder={<CustomPlaceholder />}
/>
```

### Touch Gestures
Swipe-right-to-go-back is enabled by default:
```typescript
import { useSwipeGesture } from '@hooks/useSwipeGesture';

// In your component
useSwipeGesture({ 
  enabled: true, 
  threshold: 100 // pixels
});
```

## Accessibility Features

### Keyboard Shortcuts
Global shortcuts available:
- **S**: Navigate to Scan page
- **H**: Navigate to History page
- **Tab**: Navigate forward
- **Shift + Tab**: Navigate backward
- **Enter**: Activate buttons/links
- **Escape**: Close modals/drawers

### Custom Keyboard Shortcuts
```typescript
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';

useKeyboardShortcuts([
  {
    key: 'k',
    ctrlKey: true,
    action: () => console.log('Ctrl+K pressed'),
    description: 'Open search'
  }
]);
```

### Screen Reader Announcements
```typescript
import { announceToScreenReader } from '@utils/accessibility';

// Polite announcement (default)
announceToScreenReader('Item added to cart');

// Assertive announcement (interrupts)
announceToScreenReader('Error occurred', 'assertive');
```

### Focus Management
```typescript
import { trapFocus, handleEscapeKey } from '@utils/accessibility';

// Trap focus in modal
const cleanup = trapFocus(modalElement);

// Handle ESC key
const cleanup = handleEscapeKey(() => closeModal());
```

### Color Contrast Checking
```typescript
import { meetsWCAGAA, getContrastRatio } from '@utils/accessibility';

// Check if colors meet WCAG AA
const isAccessible = meetsWCAGAA('#14B8A6', '#0B1220'); // true

// Get exact contrast ratio
const ratio = getContrastRatio('#14B8A6', '#0B1220'); // 5.2:1
```

## CSS Classes

### Accessibility
```css
.sr-only          /* Screen reader only */
.skip-link        /* Skip to main content */
```

### Focus States
All interactive elements automatically get 2px Teal focus indicators:
```css
*:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}
```

## Testing

### Run Tests
```bash
npm test -- --run
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lighthouse Audit
```bash
lighthouse http://localhost:4173 --view
```

## Performance Targets

- ✅ Bundle size: <200KB gzipped
- ✅ FCP: <1.5s
- ✅ LCP: <2.5s
- ✅ TTI: <3s
- ✅ Lighthouse: >90

## Accessibility Targets

- ✅ WCAG AA: 4.5:1 contrast
- ✅ Touch targets: ≥44px
- ✅ Keyboard navigable
- ✅ Screen reader compatible
- ✅ Focus indicators visible

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

## Mobile Devices Tested

- iPhone SE (375px width)
- Pixel 5 (393px width)
- iPad (768px width)

## Known Limitations

1. Barcode scanning requires camera access
2. Swipe gestures may conflict with screen reader gestures
3. Some animations disabled in reduced motion mode

## Resources

- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Full accessibility documentation
- [TASK_8_SUMMARY.md](./TASK_8_SUMMARY.md) - Implementation details
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
