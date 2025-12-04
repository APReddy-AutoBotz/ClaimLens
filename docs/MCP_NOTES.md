# MCP Integration Notes — ClaimLens

## Overview

ClaimLens uses Model Context Protocol (MCP) to integrate external services for enhanced content analysis. Four core services provide specialized capabilities while maintaining system resilience through graceful degradation.

## Service Descriptions

### OCR Label Service (localhost:7001)
**Purpose:** Extract text from menu images and nutrition fact panels
**Tools:**
- `extract_text`: OCR processing for menu photos and nutrition labels
- `detect_labels`: Identify food items and ingredients from images

**Use Cases:**
- Processing restaurant menu photos for text analysis
- Reading nutrition facts from package images
- Extracting ingredient lists from product photos

### Unit Conversion Service (localhost:7002)
**Purpose:** Normalize nutrition data across different measurement systems
**Tools:**
- `convert_units`: Convert between metric/imperial, per-serving/per-100g
- `normalize_nutrition`: Standardize nutrition data format and units

**Use Cases:**
- Converting "per serving" to "per 100g" for comparison
- Handling mixed unit systems in international menus
- Standardizing calorie, sodium, sugar measurements

### Recall Lookup Service (localhost:7003)
**Purpose:** Check ingredients and products against food safety databases
**Tools:**
- `check_recalls`: Verify ingredients against active recall lists
- `get_safety_info`: Retrieve safety advisories for specific products

**Use Cases:**
- Flagging recalled ingredients in menu items
- Providing safety context for allergen warnings
- Cross-referencing with regulatory databases

### Alternative Suggester Service (localhost:7004)
**Purpose:** Recommend compliant alternatives for flagged content
**Tools:**
- `suggest_alternatives`: Propose replacement terms for banned claims
- `find_substitutes`: Recommend ingredient alternatives for allergen-free options

**Use Cases:**
- Suggesting "nutrient-rich" instead of "superfood"
- Recommending allergen-free ingredient swaps
- Providing compliant marketing language alternatives

## Security Posture

**Network Security:**
- All services run on localhost only (no external network access)
- Communication over HTTP within container/local environment
- No authentication required for localhost services

**Data Privacy:**
- Services process data in-transit only (no persistent storage)
- No user data transmitted to external services
- Request/response logging limited to decision metadata

**Input Validation:**
- All text inputs sanitized before MCP service calls
- File uploads restricted to image formats only
- Rate limiting applied per service (100 requests/minute)

## Cloud Migration Strategy

### Development → Production
1. **Container Deployment:** Package each MCP service as Docker container
2. **Service Discovery:** Replace localhost URLs with internal service names
3. **Authentication:** Add API key authentication for service-to-service calls
4. **Load Balancing:** Deploy multiple instances behind load balancer

### Configuration Changes
```json
// Production registry.json example
{
  "ocr-label": {
    "command": "docker",
    "args": ["run", "-p", "7001:7001", "claimlens/ocr-service:latest"],
    "env": {
      "API_KEY": "${OCR_SERVICE_KEY}",
      "ENDPOINT": "https://ocr.claimlens.internal"
    }
  }
}
```

### Fallback Strategy
- **OCR Service Down:** Use text-only analysis, skip image processing
- **Unit Conversion Down:** Apply default per-100g assumptions
- **Recall Lookup Down:** Show generic safety disclaimer
- **Alt Suggester Down:** Flag issues without providing alternatives

Each service failure logs degraded mode status and continues processing with reduced functionality rather than blocking the entire pipeline.