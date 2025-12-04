#!/usr/bin/env node
// ClaimLens MCP Mock Server - OCR Label Service
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });
const PORT = 7001;

fastify.post('/ocr', async (request, reply) => {
  const { image, base64 } = request.body || {};
  
  // Mock OCR response
  const mockText = "Nutrition Facts\nServing Size: 100g\nCalories: 250\nSugar: 25g\nSodium: 650mg\nContains: Peanuts, Milk";
  
  return {
    text: mockText,
    confidence: 0.92,
    boxes: [
      { x: 10, y: 10, w: 200, h: 30, text: "Nutrition Facts" },
      { x: 10, y: 50, w: 180, h: 20, text: "Contains: Peanuts, Milk" }
    ],
    source: "mock-ocr"
  };
});

fastify.get('/health', async () => ({ status: 'ok', service: 'ocr-label' }));

try {
  await fastify.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`🔍 OCR Label Service running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
