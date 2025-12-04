/**
 * Export API Routes
 * GET /v1/export/menu.ndjson - Export processed menu items in NDJSON format
 *
 * Requirements: Data export with pagination and rate limiting
 */
import { Router } from 'express';
import { InMemoryAuditStorage } from '../../../packages/core/audit-storage-memory';
import { Errors } from '../middleware/error-handler';
const router = Router();
// Singleton audit storage instance (can be set for testing)
let auditStorage = new InMemoryAuditStorage();
/**
 * Set the audit storage backend (for testing)
 */
export function setAuditStorage(storage) {
    auditStorage = storage;
}
/**
 * Reset rate limits (for testing)
 */
export function resetRateLimits() {
    exportRateLimits.clear();
}
// In-memory rate limit tracking for export endpoint
const exportRateLimits = new Map();
function checkExportRateLimit(key) {
    const now = Date.now();
    const limit = exportRateLimits.get(key);
    if (!limit || now > limit.resetTime) {
        // Reset or create new limit
        exportRateLimits.set(key, {
            count: 1,
            resetTime: now + (60 * 60 * 1000) // 1 hour from now
        });
        return true;
    }
    if (limit.count >= 10) {
        return false; // Rate limit exceeded
    }
    limit.count++;
    return true;
}
/**
 * GET /v1/export/menu.ndjson
 * Export processed menu items in NDJSON format with pagination
 */
router.get('/menu.ndjson', (async (req, res) => {
    try {
        // Apply rate limiting
        const rateLimitKey = `${req.tenant}:${req.apiKey}`;
        const allowed = checkExportRateLimit(rateLimitKey);
        if (!allowed) {
            throw Errors.rateLimitExceeded(3600); // 1 hour in seconds
        }
        // Parse query parameters
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const cursorParam = req.query.cursor;
        // Validate cursor if provided
        if (cursorParam) {
            try {
                const decoded = Buffer.from(cursorParam, 'base64').toString();
                JSON.parse(decoded); // Validate it's valid JSON
            }
            catch (error) {
                throw Errors.badRequest('Invalid cursor format');
            }
        }
        // Query audit records for the tenant
        const records = await auditStorage.query({
            tenant: req.tenant,
            limit: limit + 1, // Fetch one extra to determine if there are more
            cursor: cursorParam
        });
        // Check if there are more records
        const hasMore = records.length > limit;
        const recordsToReturn = hasMore ? records.slice(0, limit) : records;
        // Generate next cursor if there are more records
        let nextCursor;
        if (hasMore) {
            const lastRecord = recordsToReturn[recordsToReturn.length - 1];
            const cursorData = {
                last_ts: lastRecord.ts,
                last_id: lastRecord.audit_id
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }
        // Set response headers
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('X-Total-Count', recordsToReturn.length.toString());
        if (nextCursor) {
            res.setHeader('X-Next-Cursor', nextCursor);
        }
        // Convert records to NDJSON format
        const ndjson = recordsToReturn
            .map(record => {
            // Extract cleaned item data from audit record
            const exportItem = {
                id: record.item_id,
                tenant: record.tenant,
                processed_at: record.ts,
                verdict: record.verdict.verdict,
                changes: record.verdict.changes,
                audit_id: record.audit_id,
                correlation_id: record.verdict.correlation_id
            };
            return JSON.stringify(exportItem);
        })
            .join('\n');
        // Send NDJSON response
        res.send(ndjson);
    }
    catch (error) {
        throw error;
    }
}));
export default router;
