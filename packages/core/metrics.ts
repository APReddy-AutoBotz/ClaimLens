/**
 * Prometheus-compatible Metrics for ClaimLens
 * Provides counters, histograms, and gauges for observability
 */

export interface MetricLabels {
  [key: string]: string;
}

/**
 * Counter metric - monotonically increasing value
 */
export class Counter {
  private name: string;
  private help: string;
  private labelNames: string[];
  private values: Map<string, number> = new Map();

  constructor(config: { name: string; help: string; labelNames?: string[] }) {
    this.name = config.name;
    this.help = config.help;
    this.labelNames = config.labelNames || [];
  }

  /**
   * Increment counter by 1 or specified value
   */
  inc(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.serializeLabels(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  /**
   * Get current value for labels
   */
  get(labels: MetricLabels = {}): number {
    const key = this.serializeLabels(labels);
    return this.values.get(key) || 0;
  }

  /**
   * Reset counter
   */
  reset(): void {
    this.values.clear();
  }

  /**
   * Export in Prometheus format
   */
  export(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);

    for (const [labelKey, value] of this.values) {
      if (labelKey) {
        lines.push(`${this.name}{${labelKey}} ${value}`);
      } else {
        lines.push(`${this.name} ${value}`);
      }
    }

    return lines.join('\n');
  }

  private serializeLabels(labels: MetricLabels): string {
    const pairs = Object.entries(labels)
      .filter(([key]) => this.labelNames.includes(key))
      .map(([key, value]) => `${key}="${value}"`)
      .sort();
    return pairs.join(',');
  }
}

/**
 * Histogram metric - tracks distribution of values
 */
export class Histogram {
  private name: string;
  private help: string;
  private labelNames: string[];
  private buckets: number[];
  private counts: Map<string, Map<number, number>> = new Map();
  private sums: Map<string, number> = new Map();
  private totals: Map<string, number> = new Map();

  constructor(config: {
    name: string;
    help: string;
    labelNames?: string[];
    buckets?: number[];
  }) {
    this.name = config.name;
    this.help = config.help;
    this.labelNames = config.labelNames || [];
    this.buckets = config.buckets || [10, 25, 50, 100, 150, 200, 500, 1000];
  }

  /**
   * Observe a value
   */
  observe(labels: MetricLabels = {}, value: number): void {
    const key = this.serializeLabels(labels);

    // Initialize if needed
    if (!this.counts.has(key)) {
      this.counts.set(key, new Map());
      this.sums.set(key, 0);
      this.totals.set(key, 0);
    }

    // Update sum and count
    this.sums.set(key, (this.sums.get(key) || 0) + value);
    this.totals.set(key, (this.totals.get(key) || 0) + 1);

    // Update buckets
    const bucketCounts = this.counts.get(key)!;
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
      }
    }
  }

  /**
   * Get percentile value (approximation based on buckets)
   */
  getPercentile(labels: MetricLabels = {}, percentile: number): number {
    const key = this.serializeLabels(labels);
    const total = this.totals.get(key) || 0;
    
    if (total === 0) return 0;

    const targetCount = Math.ceil(total * percentile);
    const bucketCounts = this.counts.get(key);
    
    if (!bucketCounts) return 0;

    for (const bucket of this.buckets) {
      const count = bucketCounts.get(bucket) || 0;
      if (count >= targetCount) {
        return bucket;
      }
    }

    return this.buckets[this.buckets.length - 1];
  }

  /**
   * Get average value
   */
  getAverage(labels: MetricLabels = {}): number {
    const key = this.serializeLabels(labels);
    const sum = this.sums.get(key) || 0;
    const total = this.totals.get(key) || 0;
    return total > 0 ? sum / total : 0;
  }

  /**
   * Reset histogram
   */
  reset(): void {
    this.counts.clear();
    this.sums.clear();
    this.totals.clear();
  }

  /**
   * Export in Prometheus format
   */
  export(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} histogram`);

    for (const [labelKey] of this.counts) {
      const bucketCounts = this.counts.get(labelKey)!;
      const labelStr = labelKey ? `{${labelKey}}` : '';

      // Export buckets
      for (const bucket of this.buckets) {
        const count = bucketCounts.get(bucket) || 0;
        const bucketLabel = labelKey
          ? `{${labelKey},le="${bucket}"}`
          : `{le="${bucket}"}`;
        lines.push(`${this.name}_bucket${bucketLabel} ${count}`);
      }

      // Export +Inf bucket
      const total = this.totals.get(labelKey) || 0;
      const infLabel = labelKey
        ? `{${labelKey},le="+Inf"}`
        : `{le="+Inf"}`;
      lines.push(`${this.name}_bucket${infLabel} ${total}`);

      // Export sum and count
      const sum = this.sums.get(labelKey) || 0;
      lines.push(`${this.name}_sum${labelStr} ${sum}`);
      lines.push(`${this.name}_count${labelStr} ${total}`);
    }

    return lines.join('\n');
  }

  private serializeLabels(labels: MetricLabels): string {
    const pairs = Object.entries(labels)
      .filter(([key]) => this.labelNames.includes(key))
      .map(([key, value]) => `${key}="${value}"`)
      .sort();
    return pairs.join(',');
  }
}

/**
 * Gauge metric - value that can go up or down
 */
export class Gauge {
  private name: string;
  private help: string;
  private labelNames: string[];
  private values: Map<string, number> = new Map();

  constructor(config: { name: string; help: string; labelNames?: string[] }) {
    this.name = config.name;
    this.help = config.help;
    this.labelNames = config.labelNames || [];
  }

  /**
   * Set gauge to specific value
   */
  set(labels: MetricLabels = {}, value: number): void {
    const key = this.serializeLabels(labels);
    this.values.set(key, value);
  }

  /**
   * Increment gauge
   */
  inc(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.serializeLabels(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  /**
   * Decrement gauge
   */
  dec(labels: MetricLabels = {}, value: number = 1): void {
    const key = this.serializeLabels(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }

  /**
   * Get current value
   */
  get(labels: MetricLabels = {}): number {
    const key = this.serializeLabels(labels);
    return this.values.get(key) || 0;
  }

  /**
   * Reset gauge
   */
  reset(): void {
    this.values.clear();
  }

  /**
   * Export in Prometheus format
   */
  export(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} gauge`);

    for (const [labelKey, value] of this.values) {
      if (labelKey) {
        lines.push(`${this.name}{${labelKey}} ${value}`);
      } else {
        lines.push(`${this.name} ${value}`);
      }
    }

    return lines.join('\n');
  }

  private serializeLabels(labels: MetricLabels): string {
    const pairs = Object.entries(labels)
      .filter(([key]) => this.labelNames.includes(key))
      .map(([key, value]) => `${key}="${value}"`)
      .sort();
    return pairs.join(',');
  }
}

/**
 * Metrics Registry - manages all metrics
 */
export class MetricsRegistry {
  private metrics: Map<string, Counter | Histogram | Gauge> = new Map();

  /**
   * Register a metric
   */
  register(metric: Counter | Histogram | Gauge): void {
    const name = (metric as any).name;
    if (this.metrics.has(name)) {
      throw new Error(`Metric ${name} already registered`);
    }
    this.metrics.set(name, metric);
  }

  /**
   * Get a metric by name
   */
  get(name: string): Counter | Histogram | Gauge | undefined {
    return this.metrics.get(name);
  }

  /**
   * Export all metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(metric.export());
      lines.push(''); // Empty line between metrics
    }
    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    for (const metric of this.metrics.values()) {
      metric.reset();
    }
  }
}

/**
 * Global metrics registry
 */
export const registry = new MetricsRegistry();

/**
 * ClaimLens metrics
 */
export const metrics = {
  requests_total: new Counter({
    name: 'claimlens_requests_total',
    help: 'Total number of requests',
    labelNames: ['tenant', 'route', 'status'],
  }),

  requests_failed: new Counter({
    name: 'claimlens_requests_failed',
    help: 'Total number of failed requests',
    labelNames: ['tenant', 'route', 'error_code'],
  }),

  transforms_executed: new Counter({
    name: 'claimlens_transforms_executed',
    help: 'Total number of transforms executed',
    labelNames: ['tenant', 'profile', 'transform', 'decision'],
  }),

  request_duration_ms: new Histogram({
    name: 'claimlens_request_duration_ms',
    help: 'Request duration in milliseconds',
    labelNames: ['tenant', 'route'],
    buckets: [10, 25, 50, 100, 150, 200, 500, 1000],
  }),

  transform_duration_ms: new Histogram({
    name: 'claimlens_transform_duration_ms',
    help: 'Transform duration in milliseconds',
    labelNames: ['tenant', 'profile', 'transform'],
    buckets: [1, 5, 10, 25, 50, 100, 200],
  }),

  active_requests: new Gauge({
    name: 'claimlens_active_requests',
    help: 'Number of active requests',
    labelNames: ['tenant', 'route'],
  }),

  degraded_services: new Gauge({
    name: 'claimlens_degraded_services',
    help: 'Number of degraded MCP services',
    labelNames: ['tenant'],
  }),
};

// Register all metrics
registry.register(metrics.requests_total);
registry.register(metrics.requests_failed);
registry.register(metrics.transforms_executed);
registry.register(metrics.request_duration_ms);
registry.register(metrics.transform_duration_ms);
registry.register(metrics.active_requests);
registry.register(metrics.degraded_services);
