# App Icons

## Generation Instructions

To generate PNG icons from the SVG source:

```bash
# Using ImageMagick (if available)
magick convert -background none -resize 192x192 icon.svg icon-192x192.png
magick convert -background none -resize 512x512 icon.svg icon-512x512.png

# Or using online tools:
# 1. Open icon.svg in browser
# 2. Use https://cloudconvert.com/svg-to-png
# 3. Convert to 192x192 and 512x512 sizes
```

## Icon Design

The ClaimLens Go icon features:
- Dark background (#0B1220 - Ink)
- Teal magnifying glass (#14F195 - Teal)
- Checkmark inside the glass (trust/verification)
- Green badge indicator (#10B981 - success)

This represents the app's core function: scanning and verifying food safety claims.
