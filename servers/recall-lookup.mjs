#!/usr/bin/env node
// ClaimLens MCP Mock Server - Recall Lookup Service
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });
const PORT = 7003;

const mockRecalls = {
  'peanut butter': { recalled: true, reason: 'Salmonella contamination', date: '2024-10-15' },
  'romaine lettuce': { recalled: true, reason: 'E. coli outbreak', date: '2024-09-20' },
  'chicken': { recalled: false }
};

fastify.post('/check', async (request, reply) => {
  const { product, ingredient } = request.body || {};
  
  if (!product && !ingredient) {
    return reply.code(400).send({ error: 'Missing required field: product or ingredient' });
  }
  
  const query = (product || ingredient).toLowerCase();
  const recallInfo = mockRecalls[query] || { recalled: false };
  
  return {
    product: product || ingredient,
    recalled: recallInfo.recalled || false,
    reason: recallInfo.reason || null,
    date: recallInfo.date || null,
    source: "mock-recall-db"
  };
});

fastify.get('/health', async () => ({ status: 'ok', service: 'recall-lookup' }));

try {
  await fastify.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`⚠️  Recall Lookup Service running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
