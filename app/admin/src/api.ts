import type {
  DashboardMetrics,
  EnhancedDashboardMetrics,
  FilterState,
  Profile,
  RulePack,
  Fixture,
  FixtureResult,
  AuditRecord,
  AugmentLiteFields,
  PolicyChangeRequest
} from './types';

const API_BASE = '/v1/admin';

// Demo product names for realistic audit generation
export const DEMO_PRODUCTS = [
  { name: "Organic Almond Milk", brand: "Silk", category: "Dairy Alternative" },
  { name: "Grass-Fed Beef Jerky", brand: "Epic", category: "Snacks" },
  { name: "Gluten-Free Pasta", brand: "Barilla", category: "Pasta" },
  { name: "Cold Brew Coffee", brand: "Stumptown", category: "Beverages" },
  { name: "Probiotic Yogurt", brand: "Chobani", category: "Dairy" },
  { name: "Protein Bar", brand: "RXBAR", category: "Snacks" },
  { name: "Kombucha", brand: "GT's", category: "Beverages" },
  { name: "Coconut Water", brand: "Vita Coco", category: "Beverages" },
  { name: "Immunity Booster Juice", brand: "Suja", category: "Beverages" },
  { name: "Detox Green Smoothie", brand: "Naked", category: "Beverages" }
];

// Demo audit scenarios with varied verdicts, tenants, profiles, tags, and severity
const DEMO_AUDIT_SCENARIOS = [
  { productIndex: 0, verdict: 'allow' as const, severity: 'low' as const, tags: ['allergen'], profile: 'Default', tenant: 'tenant_1' },
  { productIndex: 1, verdict: 'modify' as const, severity: 'medium' as const, tags: ['banned_claim', 'missing_disclaimer'], profile: 'Strict', tenant: 'tenant_2' },
  { productIndex: 2, verdict: 'avoid' as const, severity: 'high' as const, tags: ['banned_claim', 'recall'], profile: 'Permissive', tenant: 'tenant_3' },
  { productIndex: 3, verdict: 'allow' as const, severity: 'low' as const, tags: [], profile: 'Default', tenant: 'tenant_1' },
  { productIndex: 4, verdict: 'modify' as const, severity: 'medium' as const, tags: ['allergen'], profile: 'Permissive', tenant: 'tenant_2' },
  { productIndex: 5, verdict: 'allow' as const, severity: 'low' as const, tags: [], profile: 'Strict', tenant: 'tenant_3' },
  { productIndex: 6, verdict: 'modify' as const, severity: 'medium' as const, tags: ['pii'], profile: 'Default', tenant: 'tenant_1' },
  { productIndex: 7, verdict: 'allow' as const, severity: 'low' as const, tags: [], profile: 'Permissive', tenant: 'tenant_2' },
  { productIndex: 8, verdict: 'avoid' as const, severity: 'high' as const, tags: ['banned_claim'], profile: 'Strict', tenant: 'tenant_3' },
  { productIndex: 9, verdict: 'avoid' as const, severity: 'high' as const, tags: ['banned_claim', 'allergen'], profile: 'Default', tenant: 'tenant_1' }
];

// Generate enhanced demo audit items with varied verdicts, tenants, profiles, tags, and severity
export function generateDemoAuditItems(): any[] {
  const now = Date.now();
  
  return DEMO_AUDIT_SCENARIOS.map((scenario, index) => {
    const product = DEMO_PRODUCTS[scenario.productIndex];
    const auditId = `demo_${now}_${index}`;
    const timestamp = new Date(now - index * 60000).toISOString();
    
    // Map verdict to API format
    const apiVerdict = scenario.verdict === 'avoid' ? 'block' : scenario.verdict;
    
    return {
      audit_id: auditId,
      ts: timestamp,
      tenant: scenario.tenant,
      profile: scenario.profile,
      route: '/v1/menu/feed',
      item_id: `demo_item_${index}`,
      item_name: product.name,
      transforms: [
        { name: 'detect.allergens', duration_ms: 12, decision: scenario.tags.includes('allergen') ? 'flag' : 'pass' },
        { name: 'block.banned_claims', duration_ms: 8, decision: scenario.tags.includes('banned_claim') ? 'flag' : 'pass' },
        { name: 'rewrite.disclaimer', duration_ms: 15, decision: scenario.verdict === 'modify' ? 'modify' : 'pass' },
      ],
      verdict: {
        verdict: apiVerdict,
        changes: scenario.verdict === 'modify' ? [{ field: 'description', before: 'Original claim', after: 'Modified for compliance' }] : [],
        reasons: scenario.tags.map(tag => ({
          transform: tag === 'banned_claim' ? 'block.banned_claims' : 'detect.allergens',
          why: `Detected: ${tag}`,
          source: 'https://fssai.gov.in'
        })),
        audit_id: auditId,
        correlation_id: crypto.randomUUID(),
      },
      latency_ms: Math.floor(Math.random() * 50) + 30,
      degraded_mode: false,
      severity: scenario.severity,
      tags: scenario.tags,
      pack_version: 'v2.1.0',
    };
  });
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': crypto.randomUUID(),
      ...options?.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: (filters?: FilterState) => {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append('time_range', filters.timeRange);
    if (filters?.policyProfile) params.append('profile', filters.policyProfile);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    
    const query = params.toString();
    return fetchAPI<EnhancedDashboardMetrics>(`/dashboard${query ? `?${query}` : ''}`);
  },

  // Profiles - API returns { profiles: {...} } object, convert to array
  getProfiles: async (): Promise<Profile[]> => {
    const response = await fetchAPI<{ profiles?: Record<string, any>; version?: string }>('/profiles');
    if (response.profiles && typeof response.profiles === 'object') {
      // Convert profiles object to array format
      return Object.entries(response.profiles).map(([name, config]: [string, any]) => ({
        name,
        label: config.label || name,
        routes: Object.entries(config.routes || {}).map(([path, routeConfig]: [string, any]) => ({
          path,
          transforms: routeConfig.transforms || [],
          latency_budget_ms: routeConfig.quality?.latency_budget_ms || 150,
          thresholds: routeConfig.thresholds || {}
        }))
      }));
    }
    // Fallback if already array
    return Array.isArray(response) ? response : [];
  },
  updateProfile: (id: string, data: Partial<Profile>, augmentLite: AugmentLiteFields) =>
    fetchAPI<Profile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, augment_lite: augmentLite })
    }),

  // Rule Packs - API returns { packs: [...] }, extract array
  getRulePacks: async (): Promise<RulePack[]> => {
    const response = await fetchAPI<{ packs?: RulePack[] } | RulePack[]>('/rule-packs');
    if (Array.isArray(response)) return response;
    if (response && 'packs' in response && Array.isArray(response.packs)) {
      return response.packs;
    }
    return [];
  },
  updateRulePack: (name: string, content: string, augmentLite: AugmentLiteFields) =>
    fetchAPI<RulePack>(`/rule-packs/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ content, augment_lite: augmentLite })
    }),
  getRulePackVersions: async (name: string): Promise<RulePack[]> => {
    try {
      const response = await fetchAPI<RulePack[] | { versions?: RulePack[] }>(`/rule-packs/${name}/versions`);
      if (Array.isArray(response)) return response;
      if (response && 'versions' in response && Array.isArray(response.versions)) {
        return response.versions;
      }
      return [];
    } catch {
      return []; // Return empty array if versions endpoint doesn't exist
    }
  },

  // Fixtures - API returns { fixtures: [...] }, extract array
  getFixtures: async (): Promise<Fixture[]> => {
    const response = await fetchAPI<{ fixtures?: Fixture[] } | Fixture[]>('/fixtures');
    if (Array.isArray(response)) return response;
    if (response && 'fixtures' in response && Array.isArray(response.fixtures)) {
      return response.fixtures;
    }
    return [];
  },
  runFixtures: async (fixtures: string[]): Promise<FixtureResult[]> => {
    const response = await fetchAPI<{ results?: FixtureResult[]; summary?: any } | FixtureResult[]>('/fixtures/run', {
      method: 'POST',
      body: JSON.stringify({ fixtures, profile: 'menushield_in' })
    });
    if (Array.isArray(response)) return response;
    if (response && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  },

  // Audits
  getAudit: (id: string) => fetchAPI<AuditRecord>(`/audits/${id}`),

  // Policy Changes
  createPolicyChange: (data: {
    context: string;
    constraints: string;
    self_critique: string;
  }) =>
    fetchAPI<PolicyChangeRequest>('/policy-changes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
