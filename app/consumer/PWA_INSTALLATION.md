# PWA Installation Guide

## What is a PWA?

A Progressive Web App (PWA) is a web application that can be installed on your device like a native app. ClaimLens Go is a PWA, which means you can:

- Install it on your home screen
- Use it offline
- Get a native app-like experience
- Receive updates automatically
- No app store required

## Installation Instructions

### iOS (iPhone/iPad)

**Requirements:**
- iOS 14 or later
- Safari browser

**Steps:**

1. Open Safari and navigate to ClaimLens Go
2. Tap the **Share** button (square with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "ClaimLens Go")
5. Tap **"Add"** in the top right corner
6. The app icon will appear on your home screen

**Tips:**
- The app must be opened in Safari (not Chrome or other browsers)
- You may need to scroll down in the Share menu to find "Add to Home Screen"
- The app will open in standalone mode (no browser UI)

### Android

**Requirements:**
- Android 5.0 or later
- Chrome browser (recommended)

**Steps:**

1. Open Chrome and navigate to ClaimLens Go
2. Tap the **menu** (three dots) in the top right corner
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Tap **"Install"** in the popup dialog
5. The app icon will appear on your home screen

**Alternative method:**
- Look for the install banner at the bottom of the screen
- Tap "Install" on the banner

**Tips:**
- Chrome will automatically prompt you to install after a few visits
- The app will open in standalone mode (no browser UI)
- You can also install from the Chrome menu → "Install ClaimLens Go"

### Desktop (Windows/Mac/Linux)

**Requirements:**
- Chrome 90+, Edge 90+, or other Chromium-based browser

**Steps:**

1. Open Chrome/Edge and navigate to ClaimLens Go
2. Look for the **install icon** (⊕ or computer icon) in the address bar
3. Click the install icon
4. Click **"Install"** in the popup dialog
5. The app will open in a new window

**Alternative method:**
- Click the menu (three dots) → "Install ClaimLens Go"

**Tips:**
- The app will appear in your Start Menu (Windows) or Applications folder (Mac)
- You can pin it to your taskbar/dock
- The app opens in a standalone window (no browser tabs)

## Verifying Installation

### Check if PWA is Installed

**iOS:**
- Look for the ClaimLens Go icon on your home screen
- Tap to open - it should open without Safari UI

**Android:**
- Look for the ClaimLens Go icon in your app drawer
- Long-press to see app info
- Check "Installed apps" in Settings

**Desktop:**
- Look for ClaimLens Go in your Start Menu/Applications
- Check Chrome → Settings → Apps → Manage apps

### Check Service Worker

1. Open ClaimLens Go
2. Open browser DevTools (F12)
3. Go to Application tab (Chrome) or Storage tab (Firefox)
4. Check "Service Workers" section
5. You should see a registered service worker

## Features After Installation

### Offline Access

Once installed, you can:
- View scan history offline
- Configure allergen profile offline
- Access cached results offline
- Queue scans for when you're back online

### Standalone Mode

The app runs in standalone mode:
- No browser address bar
- No browser tabs
- Full-screen experience
- Native app-like feel

### Automatic Updates

The app updates automatically:
- No manual updates required
- Updates download in background
- Prompt to reload when update is ready

### Home Screen Icon

Custom app icon:
- 192x192px icon for standard displays
- 512x512px icon for high-res displays
- Matches ClaimLens branding

## Uninstalling

### iOS

1. Long-press the ClaimLens Go icon
2. Tap "Remove App"
3. Tap "Delete App"
4. Confirm deletion

### Android

**Method 1: From Home Screen**
1. Long-press the ClaimLens Go icon
2. Drag to "Uninstall" or tap "App info"
3. Tap "Uninstall"
4. Confirm

**Method 2: From Settings**
1. Go to Settings → Apps
2. Find "ClaimLens Go"
3. Tap "Uninstall"
4. Confirm

### Desktop

**Chrome:**
1. Go to chrome://apps
2. Right-click ClaimLens Go
3. Click "Remove from Chrome"
4. Confirm

**Edge:**
1. Go to edge://apps
2. Right-click ClaimLens Go
3. Click "Uninstall"
4. Confirm

**Alternative:**
1. Open ClaimLens Go
2. Click menu (three dots) in app window
3. Click "Uninstall ClaimLens Go"
4. Confirm

## Troubleshooting

### Install Button Not Showing

**Possible causes:**
- Already installed
- Browser doesn't support PWA
- Not using HTTPS
- Manifest.json not found

**Solutions:**
- Check if already installed
- Update browser to latest version
- Ensure site is served over HTTPS
- Check browser console for errors

### App Not Working Offline

**Possible causes:**
- Service worker not registered
- Cache not populated
- Browser cache cleared

**Solutions:**
- Visit all pages while online first
- Check service worker in DevTools
- Reload the app while online
- Clear cache and reinstall

### App Not Updating

**Possible causes:**
- Service worker not updating
- Browser cache issues
- Old version stuck

**Solutions:**
- Close and reopen the app
- Clear browser cache
- Uninstall and reinstall
- Check for browser updates

### Icon Not Showing Correctly

**Possible causes:**
- Icon files not found
- Manifest.json error
- Cache issue

**Solutions:**
- Check manifest.json in DevTools
- Clear browser cache
- Reinstall the app
- Check network tab for 404 errors

## Technical Details

### Manifest.json

```json
{
  "name": "ClaimLens Go",
  "short_name": "ClaimLens",
  "description": "Scan food items for safety and claims",
  "start_url": "/scan",
  "display": "standalone",
  "theme_color": "#0B1220",
  "background_color": "#0F1628",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

- **Cache strategy:** Cache-first for static assets, network-first for API calls
- **Offline fallback:** Custom offline page
- **Background sync:** Queued scans sync when online
- **Update strategy:** Prompt user to reload when update available

### Browser Support

| Browser | Version | PWA Support |
|---------|---------|-------------|
| Chrome | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Firefox | 88+ | ⚠️ Partial |
| Opera | 76+ | ✅ Full |
| Samsung Internet | 14+ | ✅ Full |

### Storage

- **localStorage:** Allergen profile, scan history (max 10MB)
- **Cache Storage:** Static assets, API responses (max 50MB)
- **IndexedDB:** Future use for larger datasets

## Best Practices

### For Users

1. **Install early:** Install after first successful scan
2. **Visit while online:** Cache pages before going offline
3. **Update regularly:** Accept update prompts
4. **Clear cache:** Periodically clear old data

### For Developers

1. **Test offline:** Test all features in offline mode
2. **Optimize cache:** Only cache essential assets
3. **Handle updates:** Prompt users to reload on update
4. **Monitor storage:** Track cache size and usage

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)

## Support

For installation issues:
- Email: support@claimlens.com
- GitHub Issues: https://github.com/claimlens/claimlens/issues
- Documentation: https://docs.claimlens.com/pwa
