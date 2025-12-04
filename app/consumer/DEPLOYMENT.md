# Deployment Guide

## Overview

This guide covers deploying ClaimLens Go (B2C Consumer Mode) to production environments.

## Prerequisites

- Node.js 20 LTS
- pnpm 8+
- HTTPS domain (required for PWA)
- CDN (recommended for static assets)

## Build Process

### 1. Install Dependencies

```bash
cd app/consumer
pnpm install
```

### 2. Environment Configuration

Create `.env.production`:

```env
VITE_API_URL=https://api.claimlens.com
VITE_MCP_OCR_URL=https://mcp.claimlens.com/ocr
VITE_OPEN_FOOD_FACTS_URL=https://world.openfoodfacts.org/api/v0
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

### 3. Build for Production

```bash
pnpm build
```

Output directory: `dist/`

### 4. Verify Build

```bash
pnpm preview
```

Visit http://localhost:4173 to test production build.

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy to static hosting providers like Vercel, Netlify, or Cloudflare Pages.

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd app/consumer
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd app/consumer
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

#### Cloudflare Pages

```bash
# Install Wrangler CLI
npm i -g wrangler

# Deploy
cd app/consumer
wrangler pages publish dist
```

**_redirects:**
```
/* /index.html 200
```

### Option 2: Docker Container

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker - no cache
    location = /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    # Manifest - no cache
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Build and run:**
```bash
docker build -t claimlens-go .
docker run -p 80:80 claimlens-go
```

### Option 3: AWS S3 + CloudFront

**1. Build:**
```bash
pnpm build
```

**2. Upload to S3:**
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

**3. Configure S3 bucket:**
- Enable static website hosting
- Set index document: `index.html`
- Set error document: `index.html`

**4. Configure CloudFront:**
- Create distribution
- Origin: S3 bucket
- Default root object: `index.html`
- Custom error responses: 404 → /index.html (200)
- Enable HTTPS (required for PWA)

**5. Invalidate cache:**
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Post-Deployment

### 1. Verify PWA

**Check manifest:**
```bash
curl https://your-domain.com/manifest.json
```

**Check service worker:**
```bash
curl https://your-domain.com/sw.js
```

**Test installation:**
- Open in Chrome
- Check for install prompt
- Install and test offline

### 2. Run Lighthouse Audit

```bash
lighthouse https://your-domain.com --view
```

**Target scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
- PWA: 100

### 3. Test Core Features

- [ ] Scan Hub loads
- [ ] Text input works
- [ ] URL input works
- [ ] Screenshot upload works
- [ ] Barcode scan works
- [ ] Results display correctly
- [ ] Allergen profile saves
- [ ] Scan history works
- [ ] Offline mode works
- [ ] PWA installs

### 4. Monitor Performance

**Key metrics:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

### 5. Set Up Monitoring

**Sentry (Error Tracking):**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

**Analytics:**
```typescript
// Google Analytics, Plausible, or custom analytics
if (import.meta.env.PROD) {
  // Initialize analytics
}
```

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy Consumer App

on:
  push:
    branches: [main]
    paths:
      - 'app/consumer/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        working-directory: app/consumer
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        working-directory: app/consumer
        run: pnpm test
      
      - name: Build
        working-directory: app/consumer
        run: pnpm build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: app/consumer
          vercel-args: '--prod'
```

## Performance Optimization

### 1. Code Splitting

Already configured in Vite:
- Route-based splitting
- Dynamic imports for heavy components

### 2. Asset Optimization

**Images:**
- Use WebP format
- Lazy load images
- Compress images (max 80% quality)

**Fonts:**
- Use system fonts when possible
- Preload critical fonts
- Use font-display: swap

### 3. Caching Strategy

**Static assets:**
- Cache-Control: public, max-age=31536000, immutable

**Service worker:**
- Cache-Control: public, max-age=0, must-revalidate

**API responses:**
- Cache-Control: private, max-age=3600

### 4. CDN Configuration

**Recommended CDN:**
- Cloudflare
- AWS CloudFront
- Fastly

**CDN settings:**
- Enable Brotli compression
- Enable HTTP/2
- Enable HTTP/3 (QUIC)
- Set appropriate cache TTLs

## Security

### 1. HTTPS

**Required for PWA:**
- Use Let's Encrypt for free SSL
- Configure HSTS header
- Redirect HTTP to HTTPS

### 2. Content Security Policy

**meta tag in index.html:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.claimlens.com;
  font-src 'self';
  frame-ancestors 'none';
">
```

### 3. Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### 4. Rate Limiting

Configure at API level:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Rollback Procedure

### Vercel/Netlify

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Docker

```bash
# Tag previous version
docker tag claimlens-go:latest claimlens-go:backup

# Deploy new version
docker build -t claimlens-go:latest .

# Rollback if needed
docker tag claimlens-go:backup claimlens-go:latest
docker restart claimlens-go
```

### S3 + CloudFront

```bash
# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled

# Restore previous version
aws s3api list-object-versions \
  --bucket your-bucket-name \
  --prefix index.html

aws s3api copy-object \
  --bucket your-bucket-name \
  --copy-source your-bucket-name/index.html?versionId=VERSION_ID \
  --key index.html
```

## Monitoring & Alerts

### 1. Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

**Check endpoints:**
- https://your-domain.com/
- https://your-domain.com/manifest.json
- https://your-domain.com/sw.js

### 2. Error Tracking

**Sentry alerts:**
- New error types
- Error rate spikes
- Performance degradation

### 3. Performance Monitoring

**Track metrics:**
- Page load time
- API response time
- Service worker cache hit rate
- PWA install rate

### 4. User Analytics

**Track events:**
- Scans by input method
- Trust score distribution
- Allergen profile adoption
- PWA install rate
- Offline usage

## Troubleshooting

### Build Fails

**Check:**
- Node.js version (20 LTS)
- pnpm version (8+)
- Dependencies installed
- Environment variables set

### PWA Not Installing

**Check:**
- HTTPS enabled
- manifest.json accessible
- Service worker registered
- Icons present (192x192, 512x512)

### Offline Mode Not Working

**Check:**
- Service worker registered
- Cache populated
- Network requests intercepted
- Background sync enabled

### Performance Issues

**Check:**
- Bundle size (<200KB gzipped)
- Image sizes optimized
- Code splitting enabled
- CDN configured

## Support

For deployment issues:
- Email: devops@claimlens.com
- Slack: #deployments
- Documentation: https://docs.claimlens.com/deployment
