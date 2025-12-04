/**
 * ClaimLens Go - Content Scanner
 * Progressive scanning with performance optimization
 */

import type { WebItem, ScanResult } from './types';

export class ContentScanner {
  private observer: MutationObserver | null = null;
  private processedItems: Set<string> = new Set();
  private scanQueue: HTMLElement[] = [];
  private isProcessing: boolean = false;
  private scrollTimeout: number | null = null;
  
  /**
   * Initialize scanner with viewport scan and observers
   */
  async initialize(): Promise<void> {
    // First-viewport scan (≤200ms for ≤20 items)
    await this.scanViewport();
    
    // Set up incremental scanning for rest of page
    this.setupMutationObserver();
    this.setupScrollHandler();
  }
  
  /**
   * Scan items in current viewport (≤200ms for ≤20 items)
   */
  async scanViewport(): Promise<void> {
    const start = performance.now();
    const viewportItems = this.getViewportItems();
    
    // Limit to 20 items for first scan
    const itemsToProcess = viewportItems.slice(0, 20);
    
    await this.processBatch(itemsToProcess);
    
    const duration = performance.now() - start;
    console.log(`[Scanner] Viewport scan completed in ${duration.toFixed(2)}ms`);
    
    // Queue remaining items for incremental processing
    if (viewportItems.length > 20) {
      this.scanQueue.push(...viewportItems.slice(20));
      this.scheduleIncrementalScan();
    }
  }
  
  /**
   * Get menu items visible in current viewport
   */
  private getViewportItems(): HTMLElement[] {
    const items: HTMLElement[] = [];
    
    // Common selectors for food delivery sites
    const selectors = [
      '[data-testid*="menu-item"]',
      '[class*="menu-item"]',
      '[class*="food-item"]',
      '[class*="dish-card"]',
      'article[class*="item"]',
      '.item-card',
      '.menu-card'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach(el => {
        if (this.isInViewport(el) && !this.processedItems.has(this.getElementId(el))) {
          items.push(el);
        }
      });
    }
    
    return items;
  }
  
  /**
   * Check if element is in viewport
   */
  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  /**
   * Process batch of items (5 items, ≤50ms per batch)
   */
  private async processBatch(elements: HTMLElement[]): Promise<void> {
    const batchSize = 5;
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      const start = performance.now();
      
      const items = batch
        .map(el => this.extractWebItem(el))
        .filter((item): item is WebItem => item !== null);
      
      if (items.length > 0) {
        // Send to background script for processing
        await this.sendToBackground(items);
      }
      
      const duration = performance.now() - start;
      console.log(`[Scanner] Batch processed in ${duration.toFixed(2)}ms`);
      
      // Mark as processed
      batch.forEach(el => this.processedItems.add(this.getElementId(el)));
    }
  }
  
  /**
   * Extract web item data from DOM element
   */
  private extractWebItem(element: HTMLElement): WebItem | null {
    try {
      const id = this.getElementId(element);
      const selector = this.getElementSelector(element);
      
      // Extract name
      const nameEl = element.querySelector('[class*="name"], [class*="title"], h2, h3, h4');
      const name = nameEl?.textContent?.trim() || '';
      
      if (!name) return null;
      
      // Extract description
      const descEl = element.querySelector('[class*="description"], [class*="desc"], p');
      const description = descEl?.textContent?.trim();
      
      // Extract ingredients (if available)
      const ingredientsEl = element.querySelector('[class*="ingredient"]');
      const ingredientsText = ingredientsEl?.textContent?.trim();
      const ingredients = ingredientsText ? ingredientsText.split(/[,;]/).map(s => s.trim()) : undefined;
      
      // Extract nutrition (if available)
      const nutritionEl = element.querySelector('[class*="nutrition"], [class*="calorie"]');
      const nutritionText = nutritionEl?.textContent?.trim();
      const nutrition = nutritionText ? this.parseNutrition(nutritionText) : undefined;
      
      return {
        id,
        name,
        description,
        ingredients,
        nutrition,
        dom_selector: selector
      };
    } catch (error) {
      console.error('[Scanner] Failed to extract item:', error);
      return null;
    }
  }
  
  /**
   * Parse nutrition information from text
   */
  private parseNutrition(text: string): Record<string, any> {
    const nutrition: Record<string, any> = {};
    
    // Extract calories
    const calorieMatch = text.match(/(\d+)\s*(kcal|cal)/i);
    if (calorieMatch) {
      nutrition.calories = calorieMatch[1];
    }
    
    return nutrition;
  }
  
  /**
   * Get unique ID for element
   */
  private getElementId(element: HTMLElement): string {
    return element.id || `item-${Array.from(element.parentElement?.children || []).indexOf(element)}`;
  }
  
  /**
   * Get CSS selector for element
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  /**
   * Send items to background script for API processing
   */
  private async sendToBackground(items: WebItem[]): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_ITEMS',
        items,
        locale: 'en-IN' // Default locale, will be configurable
      });
      
      if (response.success && response.badges) {
        // Send badges back to content script for rendering
        chrome.runtime.sendMessage({
          type: 'APPLY_BADGES',
          badges: response.badges
        });
      }
    } catch (error) {
      console.error('[Scanner] Failed to send items to background:', error);
    }
  }
  
  /**
   * Set up MutationObserver for dynamic content
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      const newItems = this.extractNewItems(mutations);
      if (newItems.length > 0) {
        this.scanQueue.push(...newItems);
        this.scheduleIncrementalScan();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Extract new items from mutations
   */
  private extractNewItems(mutations: MutationRecord[]): HTMLElement[] {
    const newItems: HTMLElement[] = [];
    
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Check if it's a menu item
          if (this.isMenuItem(element)) {
            const id = this.getElementId(element);
            if (!this.processedItems.has(id)) {
              newItems.push(element);
            }
          }
          
          // Check children
          const childItems = element.querySelectorAll<HTMLElement>('[class*="menu-item"], [class*="food-item"]');
          childItems.forEach(child => {
            const id = this.getElementId(child);
            if (!this.processedItems.has(id)) {
              newItems.push(child);
            }
          });
        }
      });
    }
    
    return newItems;
  }
  
  /**
   * Check if element is a menu item
   */
  private isMenuItem(element: HTMLElement): boolean {
    const className = element.className || '';
    return /menu-item|food-item|dish-card|item-card/.test(className);
  }
  
  /**
   * Set up throttled scroll handler for infinite scroll (500ms)
   */
  private setupScrollHandler(): void {
    window.addEventListener('scroll', () => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      this.scrollTimeout = window.setTimeout(() => {
        this.handleScroll();
      }, 500);
    });
  }
  
  /**
   * Handle scroll event - scan new viewport items
   */
  private handleScroll(): void {
    const viewportItems = this.getViewportItems();
    if (viewportItems.length > 0) {
      this.scanQueue.push(...viewportItems);
      this.scheduleIncrementalScan();
    }
  }
  
  /**
   * Schedule incremental scan using requestIdleCallback
   */
  private scheduleIncrementalScan(): void {
    if (this.isProcessing || this.scanQueue.length === 0) {
      return;
    }
    
    // Use requestIdleCallback for non-critical processing
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        this.processIncrementally(deadline);
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => this.processIncrementally(), 100);
    }
  }
  
  /**
   * Process items incrementally during idle time
   */
  private async processIncrementally(deadline?: IdleDeadline): Promise<void> {
    this.isProcessing = true;
    const batchSize = 5;
    
    while (this.scanQueue.length > 0) {
      // Check if we have time remaining
      if (deadline && deadline.timeRemaining() < 10) {
        break;
      }
      
      // Process next batch
      const batch = this.scanQueue.splice(0, batchSize);
      await this.processBatch(batch);
      
      // Don't block main thread for more than 50ms
      if (deadline && deadline.timeRemaining() < 10) {
        break;
      }
    }
    
    this.isProcessing = false;
    
    // Schedule next batch if queue not empty
    if (this.scanQueue.length > 0) {
      this.scheduleIncrementalScan();
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    
    this.scanQueue = [];
    this.processedItems.clear();
  }
}
