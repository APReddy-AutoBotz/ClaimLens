# ClaimLens Mock API Server

Mock API server for ClaimLens Admin Console development. Provides realistic data without requiring database or authentication setup.

## Quick Start

```bash
# Install dependencies
npm install

# Start mock API server (port 8080)
npm run dev

# Start full API server with auth (port 8080)
npm run dev:full
```

## Endpoints

### Health Check
```bash
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "claimlens-api",
  "timestamp": "2025-11-02T09:00:00.000Z"
}
```

### Dashboard Metrics
```bash
GET /v1/admin/dashboard
```

Returns KPI metrics and recent audits for the Admin Console dashboard.

### Profiles
```bash
GET /v1/admin/profiles
GET /v1/admin/profiles/:id
```

Returns transform pipeline profiles and their configurations.

### Rule Packs
```bash
GET /v1/admin/rule-packs
GET /v1/admin/rule-packs/:name
```

Returns rule pack contents (allergens, banned claims, disclaimers).

### Fixtures
```bash
GET /v1/admin/fixtures
POST /v1/admin/fixtures/run
```

List available fixtures and run fixture tests.

### Audits
```bash
GET /v1/admin/audits/:id
```

Retrieve detailed audit records.

## Testing

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test dashboard endpoint
curl http://localhost:8080/v1/admin/dashboard

# Test profiles endpoint
curl http://localhost:8080/v1/admin/profiles
```

## CORS Configuration

The mock server is configured to allow requests from:
- `http://localhost:3000` (Admin Console)

## Features

- ✅ No authentication required (for development)
- ✅ CORS enabled for localhost:3000
- ✅ Correlation ID tracking
- ✅ Realistic mock data
- ✅ Error handling with proper status codes
- ✅ Hot reload with tsx watch

## File Structure

```
app/api/
├── server-mock.ts          # Mock API server (no auth, no DB)
├── index.ts                # Full API server (with auth & DB)
├── package.json            # Dependencies and scripts
├── routes/                 # Route handlers
│   ├── admin.ts           # Admin Console endpoints
│   ├── menu.ts            # MenuShield API endpoints
│   ├── web.ts             # ClaimLens Go endpoints
│   └── ...
├── middleware/            # Express middleware
│   ├── auth.ts           # Authentication
│   ├── correlation.ts    # Correlation ID
│   ├── error-handler.ts  # Error handling
│   └── ...
└── __tests__/            # API tests
```

## Development vs Production

### Mock Server (Development)
- File: `server-mock.ts`
- Port: 8080
- No authentication
- No database
- Returns static mock data
- Perfect for frontend development

### Full Server (Production)
- File: `index.ts`
- Port: 8080
- Requires authentication (Bearer tokens)
- Requires PostgreSQL database
- Requires Redis for rate limiting
- Real data from database

## Environment Variables

```bash
# Port (default: 8080)
PORT=8080

# Redis URL (for full server)
REDIS_URL=redis://localhost:6379

# PostgreSQL connection (for full server)
DATABASE_URL=postgresql://user:pass@localhost:5432/claimlens
```

## Scripts

- `npm run dev` - Start mock server with hot reload
- `npm run dev:full` - Start full server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Response Format

### Success Response
```json
{
  "data": { ... },
  "correlation_id": "uuid"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "correlation_id": "uuid"
  }
}
```

All responses include `X-Correlation-ID` header for request tracking.

## Next Steps

1. ✅ Mock server running
2. ✅ Admin Console can fetch data
3. ⏳ Implement real database connections
4. ⏳ Add authentication middleware
5. ⏳ Connect to transform pipeline
6. ⏳ Add rate limiting
7. ⏳ Add audit trail storage

---

**Current Status:** Mock server ready for frontend development ✅
