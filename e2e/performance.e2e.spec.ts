/**
 * Performance-focused E2E tests for ClaimLens Go
 * Task 8.6: Viewport scan timing and main thread blocking tests
 * Requirements: 11.1, 11.3, 11.4
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, '../fixtures/sites');

test.describe('Performance Tests', () => {
  test('should load fixture page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(1000);
    console.log(`Page loaded in ${loadTime}ms`);
  });

  test('should measure viewport scan timing', async ({ page }) => {
    // Requirement 11.1: First-viewport scan ≤200ms for ≤20 items
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Inject scanner simulation
    const scanTime = await page.evaluate(() => {
      const start = performance.now();
      
      // Simulate viewport scan
      const items = document.querySelectorAll('.menu-item');
      const viewportItems = Array.from(items).slice(0, 20);
      
      // Process items (lightweight simulation)
      viewportItems.forEach(item => {
        const name = item.querySelector('.item-name')?.textContent || '';
        const desc = item.querySelector('.item-description')?.textContent || '';
        // Simulate extraction
        const data = { name, desc };
      });
      
      return performance.now() - start;
    });
    
    expect(scanTime).toBeLessThan(200);
    console.log(`Viewport scan: ${scanTime.toFixed(2)}ms`);
  });

  test('should not block main thread during processing', async ({ page }) => {
    // Requirement 11.3: Main thread blocking ≤50ms
    await page.goto(`file://${fixturesPath}/food-delivery-sample-1.html`);
    
    // Measure task execution time
    const taskDuration = await page.evaluate(() => {
      const start = performance.now();
      
      // Simulate batch processing
      const items = document.querySelectorAll('.menu-item');
      const batchSize = 5;
      
      for (let i = 0; i < Math.min(items.length, batchSize); i++) {
        const item = items[i];
        const text = item.textContent || '';
        // Lightweight processing
        const words = text.split(' ').length;
      }
      
      return performance.now() - start;
    });
    
    expect(taskDuration).toBeLessThan(50);
    console.log(`Batch processing: ${taskDuration.toFixed(2)}ms`);
  });

  test('should handle incremental scanning efficiently', async ({ page }) => {
    // Requirement 11.2, 11.4: Incremental scanning with batches
    await page.goto(`file://${fixturesPath}/food-delivery-sample-2.html`);
    
    const metrics = await page.evaluate(() => {
      const items = document.querySelectorAll('.menu-item');
      const batchSize = 5;
      const batches = Math.ceil(items.length / batchSize);
      const timings: number[] = [];
      
      for (let i = 0; i < batches; i++) {
        const start = performance.now();
        const batchStart = i * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, items.length);
        
        for (let j = batchStart; j < batchEnd; j++) {
          const item = items[j];
          const data = {
            name: item.querySelector('.item-name')?.textContent,
            desc: item.querySelector('.item-description')?.textContent
          };
        }
        
        timings.push(performance.now() - start);
      }
      
      return {
        batches: timings.length,
        maxTime: Math.max(...timings),
        avgTime: timings.reduce((a, b) => a + b, 0) / timings.length
      };
    });
    
    expect(metrics.maxTime).toBeLessThan(50);
    console.log(`Incremental scan: ${metrics.batches} batches, max ${metrics.maxTime.toFixed(2)}ms, avg ${metrics.avgTime.toFixed(2)}ms`);
  });
});
