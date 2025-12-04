/**
 * Fixtures Runner
 * Executes transform pipeline against test fixtures
 */
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
// ============================================================================
// Fixtures Runner
// ============================================================================
export class FixturesRunner {
    pipeline;
    fixturesPath;
    constructor(pipeline, fixturesPath = 'fixtures') {
        this.pipeline = pipeline;
        this.fixturesPath = fixturesPath;
    }
    /**
     * List available fixtures
     */
    async listFixtures() {
        const menuPath = join(this.fixturesPath, 'menu');
        const sitesPath = join(this.fixturesPath, 'sites');
        const menuFiles = await readdir(menuPath);
        const siteFiles = await readdir(sitesPath);
        return {
            menu: menuFiles.filter((f) => f.endsWith('.json')),
            sites: siteFiles.filter((f) => f.endsWith('.html')),
        };
    }
    /**
     * Run fixtures for a specific profile
     */
    async runFixtures(profile, selectedFixtures) {
        const fixtures = await this.listFixtures();
        const menuFixtures = selectedFixtures
            ? fixtures.menu.filter((f) => selectedFixtures.includes(f))
            : fixtures.menu;
        const results = [];
        const latencies = [];
        for (const fixture of menuFixtures) {
            const fixturePath = join(this.fixturesPath, 'menu', fixture);
            const content = await readFile(fixturePath, 'utf-8');
            const data = JSON.parse(content);
            if (!data.items || !Array.isArray(data.items)) {
                results.push({
                    fixture,
                    itemId: 'unknown',
                    itemName: 'unknown',
                    verdict: {
                        verdict: 'block',
                        changes: [],
                        reasons: [],
                        audit_id: '',
                        correlation_id: '',
                    },
                    flags: [],
                    warnings: [],
                    errors: ['Invalid fixture format: missing items array'],
                    latencyMs: 0,
                });
                continue;
            }
            for (const item of data.items) {
                const start = Date.now();
                try {
                    const verdict = await this.pipeline.execute(item, profile, {
                        locale: 'en-IN',
                        tenant: 'test',
                        correlationId: `fixture_${Date.now()}`,
                    });
                    const latency = Date.now() - start;
                    latencies.push(latency);
                    const flags = verdict.reasons
                        .filter((r) => r.why.includes('flag') || r.why.includes('detected'))
                        .map((r) => r.why);
                    const warnings = verdict.reasons
                        .filter((r) => r.why.includes('warning') || r.why.includes('caution'))
                        .map((r) => r.why);
                    results.push({
                        fixture,
                        itemId: item.id,
                        itemName: item.name,
                        verdict,
                        flags,
                        warnings,
                        errors: [],
                        latencyMs: latency,
                    });
                }
                catch (error) {
                    results.push({
                        fixture,
                        itemId: item.id,
                        itemName: item.name,
                        verdict: {
                            verdict: 'block',
                            changes: [],
                            reasons: [],
                            audit_id: '',
                            correlation_id: '',
                        },
                        flags: [],
                        warnings: [],
                        errors: [error instanceof Error ? error.message : String(error)],
                        latencyMs: Date.now() - start,
                    });
                }
            }
        }
        // Calculate percentiles
        latencies.sort((a, b) => a - b);
        const p50Index = Math.floor(latencies.length * 0.5);
        const p95Index = Math.floor(latencies.length * 0.95);
        const summary = {
            totalItems: results.length,
            totalFlags: results.reduce((sum, r) => sum + r.flags.length, 0),
            totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
            totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
            p50LatencyMs: latencies[p50Index] || 0,
            p95LatencyMs: latencies[p95Index] || 0,
            results,
        };
        return summary;
    }
    /**
     * Validate fixture structure
     */
    async validateFixture(fixturePath) {
        const errors = [];
        try {
            const content = await readFile(fixturePath, 'utf-8');
            const data = JSON.parse(content);
            if (!data.items) {
                errors.push('Missing items array');
            }
            else if (!Array.isArray(data.items)) {
                errors.push('items must be an array');
            }
            else {
                for (let i = 0; i < data.items.length; i++) {
                    const item = data.items[i];
                    if (!item.id) {
                        errors.push(`Item ${i}: missing id`);
                    }
                    if (!item.name) {
                        errors.push(`Item ${i}: missing name`);
                    }
                }
            }
        }
        catch (error) {
            errors.push(`Failed to parse fixture: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Get fixture statistics
     */
    async getFixtureStats() {
        const fixtures = await this.listFixtures();
        let totalItems = 0;
        for (const fixture of fixtures.menu) {
            const fixturePath = join(this.fixturesPath, 'menu', fixture);
            try {
                const content = await readFile(fixturePath, 'utf-8');
                const data = JSON.parse(content);
                if (data.items && Array.isArray(data.items)) {
                    totalItems += data.items.length;
                }
            }
            catch {
                // Skip invalid fixtures
            }
        }
        return {
            menuCount: fixtures.menu.length,
            siteCount: fixtures.sites.length,
            totalItems,
        };
    }
}
