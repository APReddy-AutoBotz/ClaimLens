/**
 * ClaimLens Go - Background Service Worker
 * Handles API communication and extension lifecycle
 */

import type { Badge, WebItem } from './types';

const API_BASE_URL = 'http://localhost:8080';

/**
 * Handle messages from content script
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    if (message.type === 'PROCESS_ITEMS') {
      processItems(message.items, message.locale)
        .then(badges => sendResponse({ success: true, badges }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    }
    
    if (message.type === 'OPEN_SIDE_PANEL') {
      openSidePanel(sender.tab?.id);
      sendResponse({ success: true });
      return false;
    }
  });
}

/**
 * Process web items through ClaimLens API
 */
async function processItems(items: WebItem[], locale: string = 'en-IN'): Promise<Badge[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/web/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Locale': locale
      },
      body: JSON.stringify({ items })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.badges || [];
  } catch (error) {
    console.error('Failed to process items:', error);
    throw error;
  }
}

/**
 * Open side panel for the current tab
 */
async function openSidePanel(tabId?: number): Promise<void> {
  if (!tabId || typeof chrome === 'undefined') return;
  
  try {
    await (chrome as any).sidePanel.open({ tabId });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
}

/**
 * Handle extension installation
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener((details: any) => {
    if (details.reason === 'install') {
      // Show consent dialog on first install
      chrome.tabs.create({ url: 'consent.html' });
    }
  });
}

export {};
