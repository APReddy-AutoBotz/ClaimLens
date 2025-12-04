/**
 * ClaimLens Audit Pack Generator
 * Generates JSONL and Markdown audit reports from audit records
 */
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
/**
 * Audit Pack Generator
 * Creates JSONL and Markdown reports from audit records
 */
export class AuditPackGenerator {
    options;
    constructor(options = {}) {
        this.options = {
            outputDir: options.outputDir || 'dist/audit-packs',
            includePerformanceMetrics: options.includePerformanceMetrics !== false,
            includeDiffs: options.includeDiffs !== false
        };
    }
    /**
     * Generate audit pack from audit records
     */
    async generate(records, packId) {
        if (records.length === 0) {
            throw new Error('No audit records provided');
        }
        const auditId = packId || `audit_${Date.now()}`;
        // Calculate summary statistics
        const summary = this.calculateSummary(records);
        // Ensure output directory exists
        await mkdir(this.options.outputDir, { recursive: true });
        // Generate JSONL file
        const jsonlPath = join(this.options.outputDir, `${auditId}.jsonl`);
        await this.generateJSONL(records, jsonlPath);
        // Generate Markdown summary
        const mdPath = join(this.options.outputDir, `${auditId}.md`);
        await this.generateMarkdown(records, summary, mdPath);
        return { jsonlPath, mdPath, summary };
    }
    /**
     * Generate JSONL format (one record per line)
     */
    async generateJSONL(records, outputPath) {
        const lines = records.map(record => JSON.stringify(record));
        const content = lines.join('\n');
        await writeFile(outputPath, content, 'utf-8');
    }
    /**
     * Generate Markdown summary with before/after diffs
     */
    async generateMarkdown(records, summary, outputPath) {
        let md = '# ClaimLens Audit Report\n\n';
        md += `**Generated:** ${new Date().toISOString()}\n`;
        md += `**Total Records:** ${records.length}\n\n`;
        // Summary section
        md += '## Summary\n\n';
        md += `- Total items analyzed: ${summary.total_items}\n`;
        md += `- Items with changes: ${summary.flagged_items}\n`;
        md += `- Total changes applied: ${summary.total_changes}\n`;
        if (this.options.includePerformanceMetrics) {
            md += `\n### Performance Metrics\n\n`;
            md += `- Average latency: ${summary.avg_latency_ms.toFixed(2)}ms\n`;
            md += `- p50 latency: ${summary.p50_latency_ms.toFixed(2)}ms\n`;
            md += `- p95 latency: ${summary.p95_latency_ms.toFixed(2)}ms\n`;
        }
        if (summary.degraded_mode_count > 0) {
            md += `\n⚠️ **Degraded Mode:** ${summary.degraded_mode_count} records processed in degraded mode\n`;
        }
        // Flags by transform
        md += `\n### Flags by Transform\n\n`;
        const sortedTransforms = Object.entries(summary.flags_by_transform)
            .sort(([, a], [, b]) => b - a);
        if (sortedTransforms.length === 0) {
            md += 'No flags generated.\n\n';
        }
        else {
            sortedTransforms.forEach(([transform, count]) => {
                md += `- **${transform}**: ${count} flags\n`;
            });
            md += '\n';
        }
        // Detailed records
        md += '## Detailed Records\n\n';
        const modifiedRecords = records.filter(r => r.verdict.verdict === 'modify');
        const allowedRecords = records.filter(r => r.verdict.verdict === 'allow');
        if (modifiedRecords.length > 0) {
            md += `### Modified Items (${modifiedRecords.length})\n\n`;
            modifiedRecords.forEach((record, idx) => {
                md += `#### ${idx + 1}. Item: ${record.item_id}\n\n`;
                md += `- **Audit ID:** ${record.audit_id}\n`;
                md += `- **Correlation ID:** ${record.verdict.correlation_id}\n`;
                md += `- **Timestamp:** ${record.ts}\n`;
                md += `- **Tenant:** ${record.tenant}\n`;
                md += `- **Profile:** ${record.profile}\n`;
                md += `- **Latency:** ${record.latency_ms.toFixed(2)}ms\n`;
                if (record.degraded_mode) {
                    md += `- **⚠️ Degraded Mode:** ${record.degraded_services?.join(', ') || 'unknown services'}\n`;
                }
                md += '\n';
                // Changes
                if (this.options.includeDiffs && record.verdict.changes.length > 0) {
                    md += '**Changes:**\n\n';
                    record.verdict.changes.forEach((change, changeIdx) => {
                        md += `${changeIdx + 1}. Field: \`${change.field}\`\n`;
                        md += `   - Before: ${this.truncate(change.before, 100)}\n`;
                        md += `   - After: ${this.truncate(change.after, 100)}\n\n`;
                    });
                }
                // Reasons
                if (record.verdict.reasons.length > 0) {
                    md += '**Reasons:**\n\n';
                    record.verdict.reasons.forEach((reason, reasonIdx) => {
                        md += `${reasonIdx + 1}. **${reason.transform}**: ${reason.why}`;
                        if (reason.source) {
                            md += ` ([source](${reason.source}))`;
                        }
                        md += '\n';
                    });
                    md += '\n';
                }
                // Transform execution details
                if (this.options.includePerformanceMetrics && record.transforms.length > 0) {
                    md += '**Transform Execution:**\n\n';
                    md += '| Transform | Duration | Decision |\n';
                    md += '|-----------|----------|----------|\n';
                    record.transforms.forEach(t => {
                        md += `| ${t.name} | ${t.duration_ms.toFixed(2)}ms | ${t.decision} |\n`;
                    });
                    md += '\n';
                }
                md += '---\n\n';
            });
        }
        if (allowedRecords.length > 0) {
            md += `### Allowed Items (${allowedRecords.length})\n\n`;
            md += 'Items that passed without modifications:\n\n';
            allowedRecords.forEach(record => {
                md += `- ${record.item_id} (${record.latency_ms.toFixed(2)}ms)`;
                if (record.verdict.reasons.length > 0) {
                    md += ` - ${record.verdict.reasons.length} flag(s)`;
                }
                md += '\n';
            });
            md += '\n';
        }
        await writeFile(outputPath, md, 'utf-8');
    }
    /**
     * Calculate summary statistics from audit records
     */
    calculateSummary(records) {
        const latencies = records.map(r => r.latency_ms).sort((a, b) => a - b);
        const flagsByTransform = {};
        let totalChanges = 0;
        let flaggedItemsCount = 0;
        let degradedModeCount = 0;
        records.forEach(record => {
            // Count changes
            totalChanges += record.verdict.changes.length;
            if (record.verdict.verdict === 'modify' || record.verdict.reasons.length > 0) {
                flaggedItemsCount++;
            }
            // Count flags by transform
            record.verdict.reasons.forEach(reason => {
                flagsByTransform[reason.transform] = (flagsByTransform[reason.transform] || 0) + 1;
            });
            // Count degraded mode
            if (record.degraded_mode) {
                degradedModeCount++;
            }
        });
        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const p50Index = Math.floor(latencies.length * 0.5);
        const p95Index = Math.floor(latencies.length * 0.95);
        return {
            total_items: records.length,
            flagged_items: flaggedItemsCount,
            total_changes: totalChanges,
            avg_latency_ms: avgLatency,
            p50_latency_ms: latencies[p50Index] || 0,
            p95_latency_ms: latencies[p95Index] || 0,
            flags_by_transform: flagsByTransform,
            degraded_mode_count: degradedModeCount
        };
    }
    /**
     * Truncate text for display
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }
}
