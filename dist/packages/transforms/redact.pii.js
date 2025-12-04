/**
 * ClaimLens PII Redactor
 * Removes personally identifiable information from text content
 */
/**
 * Redacts PII from text content (legacy function for backward compatibility)
 * @param text - Input text to redact
 * @returns Object with redacted text and count of redactions
 */
export function redactPii(text) {
    if (!text || typeof text !== 'string') {
        return {
            text: text || '',
            counts: { email: 0, phone: 0, pincode: 0 }
        };
    }
    // Unicode NFC normalization
    let redactedText = text.normalize('NFC');
    const counts = { email: 0, phone: 0, pincode: 0 };
    // Redact email addresses (conservative pattern)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = redactedText.match(emailPattern) || [];
    counts.email = emailMatches.length;
    redactedText = redactedText.replace(emailPattern, '[EMAIL_REDACTED]');
    // Redact Indian phone numbers
    // Pattern: Optional +91, then 10 digits starting with 6-9
    const phonePattern = /(?:\+91[-\s]?)?[6-9]\d{9}\b/g;
    const phoneMatches = redactedText.match(phonePattern) || [];
    counts.phone = phoneMatches.length;
    redactedText = redactedText.replace(phonePattern, '[PHONE_REDACTED]');
    // Redact pincodes when in context (6 digits with pin/pincode nearby)
    const pincodePattern = /\b(?:pin\s*code?|postal\s*code|zip\s*code)[\s:]*(\d{6})\b/gi;
    const pincodeMatches = redactedText.match(pincodePattern) || [];
    counts.pincode = pincodeMatches.length;
    redactedText = redactedText.replace(pincodePattern, (match) => match.replace(/\d{6}/, '[PINCODE_REDACTED]'));
    return {
        text: redactedText,
        counts
    };
}
/**
 * Transform pipeline interface for PII redaction
 * @param input - Input text to redact
 * @param context - Transform context with locale, tenant, etc.
 * @returns Transform result with redacted text and flags
 */
export function redactPiiTransform(input, context) {
    const result = redactPii(input);
    const flags = [];
    const totalRedactions = result.counts.email + result.counts.phone + result.counts.pincode;
    if (totalRedactions > 0) {
        flags.push({
            kind: 'ok',
            label: 'PII Protected',
            explanation: `Redacted ${result.counts.email} email(s), ${result.counts.phone} phone(s), ${result.counts.pincode} pincode(s)`,
            source: 'https://claimlens.dev/docs/privacy'
        });
    }
    return {
        text: result.text,
        modified: totalRedactions > 0,
        flags,
        metadata: {
            redaction_counts: result.counts
        }
    };
}
