# Design Document — B2C Consumer Mode

## Overview

ClaimLens B2C Consumer Mode is a mobile-first Progressive Web App that empowers consumers to make informed food choices through instant scanning and trust scoring. The design prioritizes simplicity, speed, and privacy while maintaining the dark-first glassmorph aesthetic established in the design system.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│ B2C Consumer Mode Architecture                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────┐               │
│  │  Scan Hub    │      │   Results    │               │
│  │  (React)     │─────▶│   Display    │               │
│  └──────────────┘      └──────────────┘               │
│         │                      │                        │
│         │                      ▼                        │
│         │              ┌──────────────┐               │
│         │              │ Trust Score  │               │
│         │              │ Calculator   │               │
│         │              └──────────────┘               │
│         │                      │                        │
│         ▼                      ▼                        │
│  ┌──────────────────────────────────┐                 │
│  │  POST /v1/consumer/scan API      │                 │
│  └──────────────────────────────────┘                 │
│                  │                                      │
│                  ▼                                      │
│  ┌──────────────────────────────────┐                 │
│  │  Transform Pipeline              │                 │
│  │  (claimlens_consumer profile)    │                 │
│  └──────────────────────────────────┘                 │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Allergen    │  │ Scan History │  │  Settings   │ │
│  │  Profile     │  │ (localStorage)│  │             │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                         │
│  ┌──────────────────────────────────┐                 │
│  │  Service Worker (PWA)            │                 │
│  │  - Offline cache                 │                 │
│  │  - Background sync               │                 │
│  └──────────────────────────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules + design-tokens.css
- **State Management**: React Context + localStorage
- **PWA**: Workbox for service worker
- **API Client**: Fetch API with retry logic
- **Image Processing**: Canvas API for screenshot handling
- **Barcode Scanning**: ZXing library
- **Routing**: React Router v6

