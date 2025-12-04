#!/usr/bin/env node
// ClaimLens MCP Mock Server - Alternative Suggester Service
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });
const PORT = 7004;

const alternatives = {
  'superfood': ['nutrient-rich', 'wholesome', 'nutritious'],
  'detox': ['cleansing', 'refreshing', 'revitalizing'],
  'miracle': ['effective', 'beneficial', 'supportive'],
  'cure': ['support', 'promote wellness', 'aid'],
  'fat-burning': ['metabolism-supporting', 'energizing'],
  'anti-aging': ['skin-nourishing', 'rejuvenating']
};

fastify.post('/alts', async (request, reply) => {
  const { query, context } = request.body || {};
  
  if (!query) {
    return reply.code(400).send({ error: 'Missing required field: query' });
  }
  
  const lowerQuery = query.toLowerCase();
  const suggestions = alternatives[lowerQuery] || ['healthy', 'nutritious', 'wholesome'];
  
  return {
    query,
    suggestions: suggestions.map((alt, idx) => ({
      text: alt,
      confidence: 0.9 - (idx * 0.1),
      reason: `Compliant alternative for "${query}"`
    })),
    source: "mock-suggester"
  };
});

fastify.get('/health', async () => ({ status: 'ok', service: 'alt-suggester' }));

try {
  await fastify.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`💡 Alternative Suggester Service running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
