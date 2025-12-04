# ClaimLens Consumer App

B2C consumer-facing Progressive Web App for scanning and analyzing food products.

## Setup

```bash
cd app/consumer
npm install
```

## Development

```bash
npm run dev
```

App runs on http://localhost:3002

## Build

```bash
npm run build
```

## Features Implemented

### Task 1.1: Consumer App Structure ✅
- Vite + React + TypeScript project initialized
- React Router configured with routes: /scan, /results, /history, /settings
- Design tokens imported from app/web/design-tokens.css
- Base layout with header and bottom navigation
- TypeScript strict mode enabled
- All routes render placeholder pages

### Task 1.2: Scan Hub UI ✅
- Four input method selector (URL, Screenshot, Barcode, Text)
- URL input with validation (HTTP/HTTPS protocol check)
- File upload for screenshots with image preview
- Text input with 10KB size validation
- Barcode button (placeholder for future implementation)
- Glass effect styling with mobile-first responsive design
- Scan button (disabled until valid input provided)
- Input validation with error messages
- Touch targets ≥44px for mobile accessibility
- Mobile layout optimized for <640px screens

## Accessibility

- WCAG AA compliant (4.5:1 contrast minimum)
- Keyboard navigable with visible focus indicators (2px Teal)
- ARIA labels on all interactive elements
- Screen reader support with proper semantic HTML
- Skip to main content link
- Touch targets meet 44x44px minimum

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

## Documentation

### User Documentation
- [User Guide](./USER_GUIDE.md) - Complete guide for end users
- [PWA Installation Guide](./PWA_INSTALLATION.md) - How to install as a Progressive Web App
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

### Developer Documentation
- [API Documentation](./API_DOCUMENTATION.md) - Consumer API endpoint reference
- [Trust Score Algorithm](./TRUST_SCORE_ALGORITHM.md) - How trust scores are calculated
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Accessibility Guide](./ACCESSIBILITY.md) - WCAG AA compliance details
- [Mobile & Accessibility Guide](./MOBILE_ACCESSIBILITY_GUIDE.md) - Mobile-specific guidelines

### Task Summaries
- [Task 3 Summary](./TASK_3_SUMMARY.md) - Scan API and results display
- [Task 5 Summary](./TASK_5_SUMMARY.md) - History and safer swaps
- [Task 6 Summary](./TASK_6_SUMMARY.md) - Barcode scanning
- [Task 8 Summary](./TASK_8_SUMMARY.md) - Mobile optimization and accessibility
- [Task 9 Summary](./TASK_9_SUMMARY.md) - Transform pipeline integration
- [Task 10 Summary](./TASK_10_SUMMARY.md) - Screenshot OCR and performance

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:e2e
```

### Lighthouse Audit
```bash
npm run build
npm run preview
lighthouse http://localhost:4173 --view
```

## Performance Targets

- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3s
- Lighthouse Performance Score: >90
- Bundle Size: <200KB gzipped

## Support

For issues or questions:
- Email: support@claimlens.com
- GitHub: https://github.com/claimlens/claimlens/issues
- Documentation: https://docs.claimlens.com
