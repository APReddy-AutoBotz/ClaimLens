const API_BASE = '/v1/admin';
async function fetchAPI(endpoint, options) {
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
    getDashboard: () => fetchAPI('/dashboard'),
    // Profiles
    getProfiles: () => fetchAPI('/profiles'),
    updateProfile: (id, data, augmentLite) => fetchAPI(`/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, augment_lite: augmentLite })
    }),
    // Rule Packs
    getRulePacks: () => fetchAPI('/rule-packs'),
    updateRulePack: (name, content, augmentLite) => fetchAPI(`/rule-packs/${name}`, {
        method: 'PUT',
        body: JSON.stringify({ content, augment_lite: augmentLite })
    }),
    getRulePackVersions: (name) => fetchAPI(`/rule-packs/${name}/versions`),
    // Fixtures
    getFixtures: () => fetchAPI('/fixtures'),
    runFixtures: (fixtures) => fetchAPI('/fixtures/run', {
        method: 'POST',
        body: JSON.stringify({ fixtures })
    }),
    // Audits
    getAudit: (id) => fetchAPI(`/audits/${id}`)
};
