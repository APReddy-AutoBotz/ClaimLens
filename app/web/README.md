# ClaimLens Go - Browser Extension

Real-time food content validation and allergen warnings on delivery websites.

## Architecture

### Manifest V3 Structure

- **manifest.json** - Extension configuration and permissions
- **background.ts** - Service worker for API communication
- **content.ts** - Content script for page scanning
- **scanner.ts** - Progressive content scanner with performance optimization
- **badge-renderer.ts** - CSP-safe badge rendering with accessibility
- **privacy-manager.ts** - User consent and domain allowlisting
- **sidepanel.ts** - Side panel UI for detailed view
- **consent.ts** - First-run consent dialog
- **settings.ts** - Settings page for domain management

### Key Features

#### Progressive Scanning (Requirements 11.1-11.4, 11.8)
- First-viewport scan: ≤200ms for ≤20 items
- Incremental scanning with MutationObserver
- requestIdleCallback for non-critical processing
- Batch processing: 5 items, ≤50ms per batch
- Throttled scroll handler (500ms) for infinite scroll

#### Badge Rendering (Requirements 11.5-11.7, 24.1, 24.7)
- CSP-safe (no inline scripts)
- Design tokens: Amber warn, Red danger, Emerald ok
- ARIA labels for accessibility
- Tooltip on click (≤50ms)
- No layout breaking

#### Side Panel (Requirements 12.1-12.5)
- Flagged items list
- Locale toggle (en-IN, en-US, en-GB)
- Disclaimer updates (≤100ms)
- ESC key handler
- Keyboard navigation (Tab, Enter, ESC)

#### Privacy Controls (Requirements 11.10, 22.1, 22.2)
- User consent dialog on first run
- Domain allowlist in local storage
- Settings page for domain management
- No scanning without consent

## Build Process

### Development

```bash
# Install dependencies
npm install

# Build extension
npm run build:extension
```

### Production Build

The build process uses Vite to:
1. Compile TypeScript to JavaScript
2. Bundle modules
3. Minify code
4. Generate source maps
5. Output to `dist/` directory

### Loading in Browser

1. Build the extension: `npm run build:extension`
2. Open Chrome/Edge and navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `app/web/dist` directory

## File Structure

```
app/web/
├── manifest.json           # Extension manifest (MV3)
├── background.ts           # Service worker
├── content.ts              # Content script entry
├── scanner.ts              # Content scanner class
├── badge-renderer.ts       # Badge rendering class
├── privacy-manager.ts      # Privacy controls class
├── sidepanel.html          # Side panel UI
├── sidepanel.ts            # Side panel script
├── consent.html            # Consent dialog
├── consent.ts              # Consent script
├── settings.html           # Settings page
├── settings.ts             # Settings script
├── types.ts                # TypeScript types
├── vite.config.ts          # Build configuration
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── dist/                   # Build output (generated)
```

## API Integration

The extension communicates with the ClaimLens API:

- **POST /v1/web/ingest** - Process web items and get badges
  - Input: Array of WebItem with dom_selector
  - Output: Array of Badge with correlation_id
  - Target: p95 latency ≤120ms

## Performance Targets

- First-viewport scan: ≤200ms for ≤20 items
- Main thread blocking: ≤50ms per batch
- Tooltip display: ≤50ms
- Locale change: ≤100ms

## Accessibility (WCAG AA)

- Keyboard navigation (Tab, Enter, ESC)
- Visible focus indicators (≥2px)
- ARIA labels on all interactive elements
- Color contrast ≥4.5:1
- Screen reader support

## Privacy & Security

- Content Security Policy compliant
- No inline scripts or eval
- User consent required
- Domain allowlist enforced
- Local storage only (no external data collection)

## Testing

Extension testing should cover:
- Viewport scan timing
- Main thread blocking
- Infinite scroll support
- Badge rendering and tooltips
- Keyboard navigation
- WCAG AA compliance

## Next Steps

1. Implement POST /v1/web/ingest endpoint (Task 8.2)
2. Add E2E tests with Playwright (Task 8.6)
3. Design and add actual icon assets
4. Test on multiple food delivery websites
5. Optimize performance for large menus
