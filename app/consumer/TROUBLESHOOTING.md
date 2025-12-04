# Troubleshooting Guide

## Common Issues

### Scanning Issues

#### Scan Button Disabled

**Symptoms:**
- Scan button is grayed out
- Cannot click scan button

**Causes:**
- No input provided
- Invalid input format
- Input exceeds size limit

**Solutions:**

1. **For Text Input:**
   - Ensure text is not empty
   - Check text size (max 10KB)
   - Remove special characters if causing issues

2. **For URL Input:**
   - Verify URL starts with `http://` or `https://`
   - Check for typos in URL
   - Ensure URL is accessible

3. **For Screenshot:**
   - Verify file is an image (JPEG, PNG, WebP)
   - Check file size (max 5MB)
   - Try a different image

4. **For Barcode:**
   - Ensure barcode is detected
   - Check camera permissions
   - Try manual input if barcode fails

#### Scan Takes Too Long

**Symptoms:**
- Loading spinner for >10 seconds
- Request times out

**Causes:**
- Slow internet connection
- Large image file
- Server overload

**Solutions:**

1. Check internet connection speed
2. Reduce image size before uploading
3. Try text input instead of screenshot
4. Wait and retry after a few minutes
5. Check server status

#### Scan Fails with Error

**Symptoms:**
- Error message displayed
- Scan does not complete

**Common Errors:**

**"Invalid input"**
- Check input format
- Verify size limits
- Remove special characters

**"Network error"**
- Check internet connection
- Verify server is accessible
- Try again later

**"Rate limit exceeded"**
- Wait 60 seconds
- Reduce scan frequency
- Contact support if persistent

**"Server error"**
- Try again in a few minutes
- Check server status
- Report issue if persistent

### Barcode Scanning Issues

#### Camera Not Opening

**Symptoms:**
- Camera permission denied
- Black screen instead of camera

**Solutions:**

1. **Check Browser Permissions:**
   - Chrome: Settings → Privacy → Camera
   - Safari: Settings → Safari → Camera
   - Allow camera access for the site

2. **Check Device Permissions:**
   - iOS: Settings → Privacy → Camera
   - Android: Settings → Apps → Permissions → Camera
   - Enable camera for browser

3. **Try Different Browser:**
   - Some browsers have better camera support
   - Chrome and Safari recommended

4. **Restart Browser:**
   - Close all tabs
   - Reopen browser
   - Try again

#### Barcode Not Detected

**Symptoms:**
- Camera shows but barcode not recognized
- No product found

**Solutions:**

1. **Improve Lighting:**
   - Use natural light if possible
   - Avoid shadows on barcode
   - Avoid glare and reflections

2. **Adjust Distance:**
   - Hold camera 4-6 inches from barcode
   - Ensure barcode fills frame
   - Keep camera steady

3. **Clean Barcode:**
   - Wipe barcode with clean cloth
   - Ensure barcode is not damaged
   - Try different angle

4. **Manual Entry:**
   - Type barcode number manually
   - Use text input method instead

#### Product Not Found

**Symptoms:**
- Barcode detected but no product data
- "Product not found" message

**Solutions:**

1. **Verify Barcode:**
   - Check barcode number is correct
   - Try scanning again
   - Verify product is in database

2. **Use Alternative Input:**
   - Take photo of label (screenshot method)
   - Type ingredients manually (text method)
   - Enter product URL if available

3. **Report Missing Product:**
   - Submit product to Open Food Facts
   - Use manual input for now

### Screenshot/OCR Issues

#### Text Extraction Failed

**Symptoms:**
- "Image analysis unavailable" error
- No text extracted from image

**Solutions:**

1. **Check Image Quality:**
   - Take clearer photo
   - Ensure good lighting
   - Avoid blur and glare

2. **Check Image Format:**
   - Use JPEG or PNG
   - Avoid WebP if issues persist
   - Convert image format if needed

3. **Check File Size:**
   - Reduce image size if >5MB
   - Compress image before upload
   - Crop to relevant area only

4. **Check Internet Connection:**
   - OCR requires internet
   - Verify connection is stable
   - Try again with better connection

5. **Use Alternative Method:**
   - Type text manually
   - Use URL input if available

#### Extracted Text Incorrect

**Symptoms:**
- Text extracted but contains errors
- Missing or garbled text

**Solutions:**

1. **Edit Extracted Text:**
   - Use the text editor to correct errors
   - Add missing information
   - Remove incorrect text

2. **Retake Photo:**
   - Ensure text is clearly visible
   - Use better lighting
   - Hold camera steady

3. **Use Manual Input:**
   - Type text directly
   - More accurate than OCR for poor images

### Allergen Profile Issues

#### Allergens Not Saving

**Symptoms:**
- Toggles reset after reload
- Custom allergens disappear

**Solutions:**

1. **Check Browser Storage:**
   - Ensure localStorage is enabled
   - Check browser privacy settings
   - Disable private/incognito mode

2. **Clear Cache:**
   - Clear browser cache
   - Reload page
   - Reconfigure allergens

3. **Check Browser Compatibility:**
   - Update browser to latest version
   - Try different browser
   - Check browser console for errors

#### Allergens Not Detected in Results

**Symptoms:**
- Allergen in profile but not highlighted
- No allergen warning shown

**Solutions:**

1. **Check Allergen Name:**
   - Ensure exact match (case-insensitive)
   - Try common variations (e.g., "Peanuts" vs "Peanut")
   - Add custom allergen if needed

2. **Check Input Text:**
   - Verify allergen is mentioned in text
   - Check for alternative names
   - Look for "contains" or "may contain" statements

3. **Refresh Profile:**
   - Toggle allergen off and on
   - Reload page
   - Try scan again

### Scan History Issues

#### History Not Saving

**Symptoms:**
- Scans not appearing in history
- History is empty

**Solutions:**

1. **Check Save Toggle:**
   - Ensure "Save to history" is enabled on results page
   - Toggle should be checked by default

2. **Check Browser Storage:**
   - Ensure localStorage is enabled
   - Check available storage space
   - Clear old data if storage full

3. **Check Browser Settings:**
   - Disable private/incognito mode
   - Allow cookies and site data
   - Check privacy settings

#### History Items Missing

**Symptoms:**
- Some scans missing from history
- History cleared unexpectedly

**Causes:**
- History limit reached (50 items)
- Browser cache cleared
- Storage quota exceeded

**Solutions:**

1. **Export Important Scans:**
   - Take screenshots of results
   - Save product names and scores
   - Export feature coming soon

2. **Clear Old Scans:**
   - Remove old scans manually
   - Keep only important ones
   - History auto-clears oldest when limit reached

#### Cannot Clear History

**Symptoms:**
- Clear button not working
- History persists after clearing

**Solutions:**

1. **Use Confirmation Dialog:**
   - Click "Clear History"
   - Click "Confirm" in dialog
   - Wait for confirmation message

2. **Manual Clear:**
   - Open browser DevTools (F12)
   - Go to Application → Storage → localStorage
   - Delete `claimlens_scan_history` key
   - Reload page

### Offline Mode Issues

#### Offline Banner Not Showing

**Symptoms:**
- No offline indicator when offline
- App appears online but requests fail

**Solutions:**

1. **Check Service Worker:**
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered
   - Check status is "activated"

2. **Reload Page:**
   - Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear cache and reload
   - Reinstall PWA

#### Content Not Available Offline

**Symptoms:**
- Pages don't load offline
- "No internet connection" error

**Solutions:**

1. **Cache Pages While Online:**
   - Visit all pages while online first
   - Wait for pages to fully load
   - Check service worker cache in DevTools

2. **Check Service Worker:**
   - Verify service worker is active
   - Check cache storage in DevTools
   - Look for cached resources

3. **Reinstall PWA:**
   - Uninstall app
   - Clear browser cache
   - Reinstall and visit pages while online

#### Queued Scans Not Syncing

**Symptoms:**
- Scans queued but not processing when online
- Sync status stuck

**Solutions:**

1. **Check Internet Connection:**
   - Verify connection is restored
   - Check connection speed
   - Try manual sync

2. **Reload Page:**
   - Close and reopen app
   - Hard reload page
   - Check sync status

3. **Clear Queue:**
   - Open DevTools → Application → IndexedDB
   - Clear sync queue
   - Try scan again

### Performance Issues

#### App Slow to Load

**Symptoms:**
- Long initial load time (>5 seconds)
- White screen on startup

**Solutions:**

1. **Check Internet Speed:**
   - Test connection speed
   - Use faster connection if available
   - Wait for full load

2. **Clear Cache:**
   - Clear browser cache
   - Clear app data
   - Reload page

3. **Reduce History Size:**
   - Clear old scans
   - Keep history under 25 items
   - Export and clear regularly

4. **Update Browser:**
   - Update to latest version
   - Try different browser
   - Check browser compatibility

#### Results Page Slow to Render

**Symptoms:**
- Long wait after scan completes
- Blank results page

**Solutions:**

1. **Check API Response:**
   - Open DevTools → Network
   - Check API response time
   - Look for errors

2. **Reduce Data Size:**
   - Use text input instead of URL
   - Reduce image size for screenshots
   - Simplify input text

3. **Clear Cache:**
   - Clear browser cache
   - Clear app data
   - Reload page

#### High Memory Usage

**Symptoms:**
- Browser tab crashes
- Device becomes slow

**Solutions:**

1. **Clear History:**
   - Remove old scans
   - Clear cache
   - Restart browser

2. **Close Other Tabs:**
   - Close unused tabs
   - Restart browser
   - Free up device memory

3. **Reduce Image Sizes:**
   - Compress images before upload
   - Use text input when possible
   - Avoid large screenshots

### PWA Installation Issues

See [PWA_INSTALLATION.md](./PWA_INSTALLATION.md) for detailed troubleshooting.

### Accessibility Issues

#### Screen Reader Not Working

**Symptoms:**
- Screen reader not announcing content
- Missing ARIA labels

**Solutions:**

1. **Check Screen Reader:**
   - Ensure screen reader is enabled
   - Update screen reader software
   - Try different screen reader

2. **Check Browser Compatibility:**
   - Use recommended browsers
   - Update browser to latest version
   - Check accessibility settings

3. **Report Issue:**
   - Provide specific element
   - Include screen reader name/version
   - Contact support

#### Keyboard Navigation Not Working

**Symptoms:**
- Cannot tab through elements
- Focus not visible

**Solutions:**

1. **Check Browser Settings:**
   - Enable keyboard navigation
   - Check accessibility settings
   - Disable mouse-only mode

2. **Check Focus Indicators:**
   - Look for 2px teal outline
   - Try different browser
   - Report if missing

3. **Use Keyboard Shortcuts:**
   - Tab: Navigate forward
   - Shift+Tab: Navigate backward
   - Enter: Activate
   - Escape: Close

## Error Messages

### "Invalid input"
- Check input format and size
- Verify required fields
- Remove special characters

### "Network error"
- Check internet connection
- Verify server is accessible
- Try again later

### "Rate limit exceeded"
- Wait 60 seconds
- Reduce scan frequency
- Contact support if persistent

### "Server error"
- Try again in a few minutes
- Check server status
- Report if persistent

### "Image analysis unavailable"
- Check internet connection
- Verify image format
- Try text input instead

### "Product not found"
- Verify barcode number
- Try alternative input method
- Report missing product

### "Text exceeds 10KB limit"
- Reduce text size
- Remove unnecessary content
- Split into multiple scans

### "Image exceeds 5MB limit"
- Compress image
- Reduce image resolution
- Crop to relevant area

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Check browser console for errors (F12)
3. Try different browser
4. Clear cache and try again
5. Check internet connection

### When Contacting Support

Include:
- Browser name and version
- Device type (mobile/desktop)
- Operating system
- Steps to reproduce issue
- Error messages (screenshots helpful)
- Correlation ID (from error screen)

### Contact Information

- **Email:** support@claimlens.com
- **GitHub Issues:** https://github.com/claimlens/claimlens/issues
- **Documentation:** https://docs.claimlens.com

### Response Times

- Critical issues: 24 hours
- High priority: 48 hours
- Normal priority: 5 business days

## Known Issues

### Current Limitations

1. **Barcode Database:**
   - Limited to Open Food Facts database
   - Some products may not be found
   - Workaround: Use manual input

2. **OCR Accuracy:**
   - Depends on image quality
   - May have errors with handwriting
   - Workaround: Edit extracted text

3. **Offline Limitations:**
   - New scans require internet
   - Barcode lookup requires internet
   - OCR requires internet

4. **Browser Support:**
   - Firefox has limited PWA support
   - Some features may not work in older browsers
   - Workaround: Use Chrome or Safari

### Upcoming Fixes

- Improved barcode detection
- Better OCR accuracy
- Faster scan processing
- Enhanced offline support
- More allergen variations

## Diagnostic Tools

### Browser DevTools

**Open DevTools:**
- Chrome/Edge: F12 or Ctrl+Shift+I
- Safari: Cmd+Option+I
- Firefox: F12 or Ctrl+Shift+I

**Useful Tabs:**
- **Console:** Check for JavaScript errors
- **Network:** Check API requests
- **Application:** Check service worker, cache, localStorage
- **Performance:** Check load times

### Check Service Worker

1. Open DevTools
2. Go to Application tab
3. Click "Service Workers"
4. Verify status is "activated"
5. Check "Update on reload" for testing

### Check Cache

1. Open DevTools
2. Go to Application tab
3. Click "Cache Storage"
4. Verify cached resources
5. Clear cache if needed

### Check localStorage

1. Open DevTools
2. Go to Application tab
3. Click "Local Storage"
4. Check stored data
5. Clear if needed

## Additional Resources

- [User Guide](./USER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [PWA Installation](./PWA_INSTALLATION.md)
- [Trust Score Algorithm](./TRUST_SCORE_ALGORITHM.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
