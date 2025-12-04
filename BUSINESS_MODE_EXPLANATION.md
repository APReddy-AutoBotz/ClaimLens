# Business Mode Toggle - How It Works

## Overview

The "Business" toggle on the Consumer app's hero page is designed to help users discover the separate Admin (B2B) application.

## What Happens When You Click "Business"

When you click the "Business" tab in the mode switch, a modal appears that:

1. **Checks if the Admin app is running** on `http://localhost:3000`
2. **If running**: Shows a direct link to open the Admin app
3. **If not running**: Shows instructions on how to start it

## The Two Apps

### Consumer App (B2C) - Port 5173
- **What you're currently using**
- Individual consumers scan food products
- Features:
  - URL/Screenshot/Barcode/Text scanning
  - Trust score (0-100)
  - Allergen profile
  - Safer swaps
  - Scan history
  - PWA/offline support

### Admin App (B2B) - Port 3000
- **Separate application for businesses**
- Restaurant chains, food delivery platforms
- Features:
  - Bulk menu processing
  - Tenant management
  - API key management
  - Webhook configuration
  - Multi-tenant isolation
  - Rate limiting controls

## How to Access the Admin App

### Option 1: If Admin App is Already Running
1. Click "Business" toggle on Consumer app
2. Click "Open Admin App →" in the modal
3. Admin app opens in new tab

### Option 2: If Admin App is Not Running
1. Click "Business" toggle on Consumer app
2. Follow the instructions in the modal:
   ```bash
   cd app/admin
   npm run dev
   ```
3. Visit `http://localhost:3000`

## Why Two Separate Apps?

The Consumer and Admin apps are intentionally separate because:

1. **Different User Bases**
   - Consumer: Individual users
   - Admin: Business users (restaurants, platforms)

2. **Different Features**
   - Consumer: Simple, fast, personal
   - Admin: Complex, bulk operations, multi-tenant

3. **Different Performance Needs**
   - Consumer: Optimized for mobile, PWA
   - Admin: Desktop-focused, data-heavy

4. **Security**
   - Consumer: Public, no authentication
   - Admin: Requires API keys, tenant isolation

## Implementation Details

### BusinessModeModal Component

**File:** `app/consumer/src/components/BusinessModeModal.tsx`

The modal:
- Checks if Admin app is running via `fetch('http://localhost:3000')`
- Shows different UI based on whether Admin is running
- Provides clear instructions and feature list
- Accessible (ESC to close, focus management, ARIA labels)
- Respects `prefers-reduced-motion`

### Mode Switch Behavior

**File:** `app/consumer/src/pages/Home.tsx`

```typescript
const handleModeChange = (newMode: 'consumer' | 'business') => {
  setMode(newMode);
  if (newMode === 'business') {
    setShowBusinessModal(true);
    setMode('consumer'); // Reset back to consumer
  }
};
```

The toggle:
- Opens the modal when "Business" is clicked
- Immediately resets back to "Consumer" mode
- Doesn't actually change the app mode (since they're separate apps)

## User Experience Flow

```
User clicks "Business" toggle
         ↓
Modal opens
         ↓
    Is Admin running?
    ↙            ↘
  YES             NO
   ↓               ↓
Show link      Show instructions
   ↓               ↓
Click link     Start Admin app
   ↓               ↓
Opens in       Visit localhost:3000
new tab
```

## Future Enhancements

Potential improvements:
1. **Auto-detect Admin port** - Check multiple ports
2. **One-click start** - Button to start Admin app (if possible)
3. **Embedded iframe** - Show Admin app within Consumer app
4. **Unified auth** - Single sign-on between apps
5. **Cross-app navigation** - Deep links between apps

## Testing

The modal includes:
- Accessibility features (keyboard navigation, ARIA)
- Loading state while checking if Admin is running
- Error handling if fetch fails
- Responsive design for mobile

## Summary

The "Business" toggle is a **discovery mechanism** that helps users find the Admin app. It doesn't switch the current app's mode - instead, it provides information and links to access the separate Admin application.

This design keeps the Consumer app simple and focused while making it easy for business users to discover the more powerful Admin features.

---

**Related Files:**
- `app/consumer/src/components/BusinessModeModal.tsx`
- `app/consumer/src/components/BusinessModeModal.module.css`
- `app/consumer/src/pages/Home.tsx`
- `app/admin/` (separate app)
