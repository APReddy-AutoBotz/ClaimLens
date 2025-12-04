# ClaimLens — Kiroween Edition 🎃

**ClaimLens** is a food label claim verification system with proof-first design.

## 🌐 Live Demo

**Try it now:** [https://claimlens.netlify.app](https://claimlens.netlify.app)

## SKUs
- **ClaimLens MenuShield** (B2B pre-publish gate for cloud kitchens/marketplaces)
- **ClaimLens Go** (B2C mobile-first PWA, installable)
- **ClaimLens Packs** (Allergens, Banned Claims, Disclaimers, per locale)

---

## ⚡ 3-Minute Demo Flow

**Try the live app or run locally:**

### Option A: Live Demo (Recommended)
1. Visit [https://claimlens.netlify.app](https://claimlens.netlify.app)
2. Click "Try Demo" for a quick sample, or paste text below and scan

**🎯 What You should look for:**
- Scan the AVOID sample → see Trust Score breakdown → tap "Why this score?"
- Go to Settings → toggle allergens → scan again → see personalized warnings
- Check History → see saved scans with search/filter
- Tap "Share Results" → see shareable proof card generation
- Notice the Kiroween "Haunted Lens" theme with glassmorphism effects

> **Note:** Live demo is Consumer PWA only. Admin UI requires local setup.

### Option B: Local Development

| Step | Action | What to Notice |
|------|--------|----------------|
| 1 | Open Admin UI → http://localhost:3000 | Dashboard with compliance metrics, MCP health panel |
| 2 | Click "Audit Trail" in sidebar | See audit entries with receipts (proof of each decision) |
| 3 | Click any audit row → "View Receipts" | Drawer shows transform chain + evidence |
| 4 | Check MCP Health panel (top-right) | Green = healthy, Yellow = degraded mode active |
| 5 | Open Consumer App → http://localhost:3002 | Kiroween "Haunted Lens" theme, glassmorphism |
| 6 | Paste this text and scan: | |
| | `SuperDetox Miracle Weight Loss Tea` | |
| | `Burns fat instantly! Clinically proven!` | |
| 7 | See verdict: **AVOID** | Trust score, issues list, "Why" explanations |
| 8 | Tap "Show Receipts" | Proof drawer with evidence for each flag |

**Key differentiators:**
- Every decision has receipts (audit trail)
- MCP degraded mode keeps system running if services fail
- No account required, privacy-first
- Installable PWA with offline support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- pnpm (`npm i -g pnpm`)

### 1. Install Dependencies
```sh
pnpm install
```

### 2. Start All Services
```sh
# Terminal 1: API + MCP Mock Servers
pnpm mcp:dev             # Starts on ports 7001-7004, 8080

# Terminal 2: Admin UI
cd app/admin
pnpm dev                 # http://localhost:3000

# Terminal 3: Consumer App (ClaimLens Go)
cd app/consumer
pnpm dev                 # http://localhost:3002
```

### Ports Summary
| Service | Port | URL |
|---------|------|-----|
| Admin UI | 3000 | http://localhost:3000 |
| Consumer PWA | 3002 | http://localhost:3002 |
| API Server | 8080 | http://localhost:8080 |
| MCP OCR | 7001 | - |
| MCP Units | 7002 | - |
| MCP Recalls | 7003 | - |
| MCP Alternatives | 7004 | - |

---

## 📱 Consumer App (ClaimLens Go)

**Live:** [https://claimlens.netlify.app](https://claimlens.netlify.app)

Mobile-first PWA (installable) for scanning food products.

**Features:**
- 4 input methods: URL, Screenshot, Barcode, Text
- Trust score (0-100) with verdict (Allow/Caution/Avoid)
- Smart product name extraction from scanned text
- Score breakdown with "Why this score?" explanations
- Allergen profile & personalized alerts
- Scan history with search/filter (localStorage)
- Safer swaps suggestions with personalization
- Shareable proof cards & results
- PWA with offline support (installable on mobile/desktop)
- WCAG AA accessible with reduced motion support

**Demo Examples to Scan:**
```
# AVOID verdict (strong warnings)
SuperDetox Miracle Weight Loss Tea
Burns fat instantly! Melts belly fat overnight!
Clinically proven to lose 20 lbs in 7 days

# CAUTION verdict (moderate issues)
Organic Immunity Booster Almond Milk
Boosts immune system naturally
Prevents cold and flu

# ALLOW verdict (clean product)
Simply Organic Almond Milk
Ingredients: Filtered water, organic almonds, sea salt
USDA Organic certified
```

---

## 🖥️ Admin UI (MenuShield)

B2B dashboard for compliance teams.

**Features:**
- Real-time compliance dashboard
- Audit viewer with receipts
- Rule packs editor
- Action queue management
- MCP health monitoring with degraded mode visibility

---

## 🔧 Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` errors:

```sh
# Windows - find what's using a port
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <pid> /F

# Or use different ports:
# Admin: cd app/admin && PORT=3001 pnpm dev
# Consumer: cd app/consumer && PORT=3003 pnpm dev
```

### Confirm Services Are Running

```sh
# Check API server
curl http://localhost:8080/health

# Check Admin UI
curl http://localhost:3000

# Check Consumer App
curl http://localhost:3002
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `pnpm: command not found` | Run `npm i -g pnpm` |
| MCP servers not starting | Ensure ports 7001-7004 are free |
| Consumer app blank | Check browser console, ensure API is running |
| Admin shows "No data" | Run `pnpm mcp:dev` first to start mock servers |

---

## 🧪 Testing

```sh
pnpm test                # Unit tests (Vitest)
pnpm test:e2e            # E2E tests (Playwright)
pnpm test:fixtures       # Scan fixtures
```

---

## 📁 Project Structure

```
/app
  /admin      # Admin console UI (port 3000)
  /consumer   # B2C consumer PWA (port 3002)
  /api        # API server + routes
/packages
  /transforms # Transform libraries (disclaimer, PII, weasel words, trust score)
  /core       # Core utilities (trust scoring, safer swaps)
/packs        # Rule packs (allergens, claims, disclaimers)
/servers      # MCP mock services
/fixtures     # Test fixtures
/e2e          # Playwright E2E tests
/.kiro        # Kiro specs, steering, hooks
```

---

## 🎃 Kiroween Theme

The Consumer app features the "Haunted Lens" theme:
- Spectral Teal (`#14B8A6`) - Primary actions
- Ember Orange (`#F59E0B`) - Warnings
- Glassmorphism effects with subtle grain
- Spooky-but-classy microcopy ("Marked safe… for now.")

---

## License

MIT
