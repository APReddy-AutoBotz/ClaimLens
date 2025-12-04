#!/usr/bin/env node
// ClaimLens MCP Mock Server - Unit Conversion Service
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });
const PORT = 7002;

const conversionRates = {
  'g-mg': 1000,
  'mg-g': 0.001,
  'oz-g': 28.35,
  'g-oz': 0.035,
  'serving-100g': 0.8 // Mock conversion factor
};

fastify.post('/convert', async (request, reply) => {
  const { from, to, value } = request.body || {};
  
  if (!from || !to || value === undefined) {
    return reply.code(400).send({ error: 'Missing required fields: from, to, value' });
  }
  
  const key = `${from}-${to}`;
  const rate = conversionRates[key] || 1;
  const result = parseFloat(value) * rate;
  
  return {
    from,
    to,
    value: parseFloat(value),
    result: Math.round(result * 100) / 100,
    rate,
    source: "mock-converter"
  };
});

fastify.get('/health', async () => ({ status: 'ok', service: 'unit-convert' }));

try {
  await fastify.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`📏 Unit Conversion Service running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
