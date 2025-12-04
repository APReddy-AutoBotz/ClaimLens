# ClaimLens — Kiroween Edition 🎃

**ClaimLens** is a food label claim verification system with proof-first design.

## SKUs
- **ClaimLens MenuShield** (B2B pre-publish gate for cloud kitchens/marketplaces)
- **ClaimLens Go** (B2C consumer mobile app)
- **ClaimLens Packs** (Allergens, Banned Claims, Disclaimers, per locale)

---

## 🚀 Quick Start (< 5 minutes)

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
| Consumer App | 3002 | http://localhost:3002 |
| API Server | 8080 | http://localhost:8080 |
| MCP OCR | 7001 | - |
| MCP Units | 7002 | - |
| MCP Recalls | 7003 | - |
| MCP Alternatives | 7004 | - |

---

## 📱 Consumer App (ClaimLens Go)

The B2C mobile-first PWA for scanning food products.

**Features:**
- 4 input methods: URL, Screenshot, Barcode, Text
- Trust score (0-110) with verdict (Allow/Caution/Avoid)
- Allergen profile & alerts
- Scan history
- Safer swaps suggestions
- PWA with offline support
- WCAG AA accessible

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

The B2B dashboard for compliance teams.

**Features:**
- Real-time compliance dashboard
- Audit viewer with receipts
- Rule packs editor
- Action queue management
- Policy change tracking

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
- Glassmorphism effects
- Spooky-but-classy microcopy

---

## License

MIT
