# ClaimLens Go - User Guide

## What is ClaimLens Go?

ClaimLens Go is a mobile-first web app that helps you make informed food choices by scanning and analyzing food products, menus, and marketing claims. Get instant trust scores, allergen warnings, and safer alternative suggestions.

## Getting Started

### 1. Access the App

Visit **http://localhost:3002** (or your deployed URL) in your mobile or desktop browser.

### 2. Install as PWA (Optional)

For the best experience, install ClaimLens Go as a Progressive Web App:

**On iOS (Safari):**
1. Tap the Share button (square with arrow)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

**On Android (Chrome):**
1. Tap the menu (three dots)
2. Tap "Install app" or "Add to Home Screen"
3. Tap "Install"

**On Desktop (Chrome/Edge):**
1. Click the install icon in the address bar
2. Click "Install"

## Features

### Scan Hub - 4 Ways to Scan

#### 1. Text Input
Paste any text from product labels, menus, or marketing materials.

**Example:**
```
Organic superfood smoothie with natural detox properties.
May help boost immunity. Contains wheat and soy.
```

**Steps:**
1. Tap "Text" input method
2. Paste or type your text (max 10KB)
3. Tap "Scan"

#### 2. URL Input
Enter a web page URL to analyze online product listings or menus.

**Example:**
```
https://example.com/products/organic-oats
```

**Steps:**
1. Tap "URL" input method
2. Enter the URL (must start with http:// or https://)
3. Tap "Scan"

#### 3. Screenshot Upload
Upload a photo of a product label or menu.

**Steps:**
1. Tap "Screenshot" input method
2. Tap "Choose File" or drag and drop
3. Select an image (JPEG, PNG, WebP, max 5MB)
4. Review extracted text (you can edit it)
5. Tap "Scan"

**Tips:**
- Take clear, well-lit photos
- Ensure text is readable
- Avoid glare and shadows

#### 4. Barcode Scan
Scan product barcodes for instant analysis.

**Steps:**
1. Tap "Barcode" input method
2. Allow camera access when prompted
3. Point camera at barcode
4. Wait for automatic detection
5. Review product info and tap "Scan"

**Supported formats:**
- UPC (Universal Product Code)
- EAN (European Article Number)
- Code 128

### Understanding Results

#### Trust Score (0-110)
A numerical score indicating product safety and claim accuracy.

- **80-110 (Green):** Safe with minimal concerns
- **50-79 (Amber):** Some concerns worth reviewing
- **0-49 (Red):** Significant concerns

#### Verdict Badge
Color-coded classification for quick decision-making.

- **✓ Allow (Green):** Go ahead
- **⚠ Caution (Amber):** Review carefully
- **✕ Avoid (Red):** Consider alternatives

#### Issues List
Detailed breakdown of detected issues:

- **Banned Claims:** Unsubstantiated marketing claims
- **Allergens:** Ingredients matching your profile
- **Weasel Words:** Vague marketing language
- **Recalls:** Product safety recalls

Each issue includes:
- Icon and label
- Explanation
- Source link (FSSAI, FDA, FSA)

#### Why Drawer
Tap "Why?" to see detailed score breakdown:

- Base score: 100
- Deductions for each issue
- Clean bonus (if applicable)
- Final score calculation

#### Safer Swaps
For products with scores below 80, see up to 3 safer alternatives with:

- Product name
- Trust score
- Key differences

Tap "View Details" to see full analysis.

### Allergen Profile

Configure your allergens for personalized scanning.

**Steps:**
1. Tap "Settings" in navigation
2. Toggle common allergens (Peanuts, Milk, Wheat, etc.)
3. Add custom allergens using the input field
4. Changes save automatically

**Features:**
- 9 common allergens pre-configured
- Add unlimited custom allergens
- Export profile as JSON backup
- Import profile from JSON file
- Clear all with confirmation

**In Results:**
- User allergens highlighted in red
- Warning banner if detected
- -20 points per user allergen

### Scan History

View your previous scans (stored locally on your device).

**Features:**
- Up to 50 most recent scans
- Filter by verdict (All, Allow, Caution, Avoid)
- Search by product name
- Tap item to view cached results
- Clear history with confirmation

**Privacy:**
- Stored in browser localStorage
- Never sent to server
- Cleared when you clear browser data

**Steps:**
1. Tap "History" in navigation
2. Use filters or search to find scans
3. Tap item to view results

### Offline Mode

ClaimLens Go works offline for cached content.

**What works offline:**
- View scan history
- Configure allergen profile
- Access settings
- View previously cached results

**What requires internet:**
- New scans
- URL fetching
- Barcode lookup
- Screenshot OCR

**Offline indicator:**
- Banner appears when offline
- Scans are queued for sync
- Auto-sync when connection restored

## Tips & Best Practices

### For Best Results

1. **Be specific:** Include full ingredient lists when possible
2. **Check allergens:** Configure your profile before scanning
3. **Review sources:** Tap source links to learn more
4. **Compare products:** Use scan history to compare options
5. **Update regularly:** Clear cache periodically for fresh data

### Privacy & Security

- **Local-first:** Data stays on your device by default
- **No tracking:** No third-party analytics or tracking
- **HTTPS only:** All API requests are encrypted
- **Delete anytime:** Clear history and profile in settings

### Accessibility

- **Screen reader support:** Full NVDA and VoiceOver compatibility
- **Keyboard navigation:** Tab through all interactive elements
- **High contrast mode:** Automatic detection and support
- **Text scaling:** Supports up to 200% zoom
- **Focus indicators:** Visible 2px teal focus rings

**Keyboard shortcuts:**
- `Tab`: Navigate forward
- `Shift+Tab`: Navigate backward
- `Enter`: Activate button/link
- `Escape`: Close drawer/modal

## Troubleshooting

### Scan Not Working

**Problem:** Scan button is disabled

**Solutions:**
- Ensure you've entered valid input
- Check URL format (must start with http:// or https://)
- Verify text is under 10KB
- Check image file size (max 5MB)

### Barcode Not Detected

**Problem:** Camera not detecting barcode

**Solutions:**
- Ensure good lighting
- Hold camera steady
- Try different angles
- Clean camera lens
- Check camera permissions

### Screenshot OCR Failed

**Problem:** Text extraction not working

**Solutions:**
- Take clearer photo
- Ensure text is readable
- Try manual text input instead
- Check internet connection

### Offline Mode Issues

**Problem:** Content not available offline

**Solutions:**
- Visit pages while online to cache them
- Check service worker registration
- Clear cache and reload
- Update to latest version

### Performance Issues

**Problem:** App is slow or unresponsive

**Solutions:**
- Clear scan history (Settings → Clear History)
- Clear browser cache
- Close other tabs/apps
- Update browser to latest version
- Check internet connection speed

## FAQ

### Is my data private?

Yes! All data stays on your device by default. Scans are processed in-memory on the server and immediately discarded. Your allergen profile and scan history are stored locally in your browser.

### How accurate is the trust score?

The trust score is based on regulatory guidelines from FSSAI, FDA, and FSA. It detects banned claims, allergens, and vague marketing language. However, it's not a substitute for professional medical or nutritional advice.

### Can I use this offline?

Yes! Once installed as a PWA, you can view scan history, configure allergen profile, and access cached results offline. New scans require internet connection.

### How many scans can I save?

Up to 50 scans are stored in your history. Older scans are automatically removed when the limit is reached.

### Can I export my data?

Yes! You can export your allergen profile as JSON from Settings. Scan history export is coming soon.

### Does this work on all devices?

Yes! ClaimLens Go works on:
- iOS Safari 14+
- Android Chrome 90+
- Desktop Chrome 90+
- Desktop Edge 90+
- Desktop Firefox 88+

### How do I report an issue?

Tap "Report Issue" on error screens or contact support at support@claimlens.com.

## Support

For additional help:
- Email: support@claimlens.com
- Documentation: https://docs.claimlens.com
- GitHub: https://github.com/claimlens/claimlens

## Version

Current version: 1.0.0
Last updated: November 2025
