/**
 * Service Worker Registration
 * Handles PWA service worker registration and updates
 */

import { registerSW as registerPWA } from 'virtual:pwa-register';

export interface ServiceWorkerUpdateEvent {
  type: 'update-available' | 'update-installed' | 'offline-ready';
  registration?: ServiceWorkerRegistration;
}

let updateCallback: ((event: ServiceWorkerUpdateEvent) => void) | null = null;

/**
 * Register service worker for PWA functionality
 */
export function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser');
    return;
  }

  const updateSW = registerPWA({
    immediate: true,
    onNeedRefresh() {
      // New content available, notify user
      console.log('New content available, please refresh');
      
      if (updateCallback) {
        updateCallback({ type: 'update-available' });
      }

      // Show update notification
      showUpdateNotification(updateSW);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      
      if (updateCallback) {
        updateCallback({ type: 'offline-ready' });
      }

      // Show offline ready notification
      showOfflineReadyNotification();
    },
    onRegistered(registration) {
      console.log('Service Worker registered', registration);
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed', error);
    }
  });

  // Check for updates every hour
  setInterval(() => {
    updateSW(true);
  }, 60 * 60 * 1000);
}

/**
 * Set callback for service worker events
 */
export function onServiceWorkerUpdate(callback: (event: ServiceWorkerUpdateEvent) => void) {
  updateCallback = callback;
}

/**
 * Show update notification to user
 */
function showUpdateNotification(updateSW: (reloadPage?: boolean) => Promise<void>) {
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 22, 40, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(20, 241, 149, 0.2);
    border-radius: 0.75rem;
    padding: 1rem 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    </style>
    <div style="color: #E5E7EB; font-size: 0.875rem; flex: 1;">
      New version available
    </div>
    <button id="sw-update-btn" style="
      background: #14F195;
      color: #0B1220;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s;
    ">
      Update
    </button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: #9CA3AF;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    ">
      ×
    </button>
  `;

  document.body.appendChild(notification);

  // Handle update button click
  const updateBtn = document.getElementById('sw-update-btn');
  updateBtn?.addEventListener('click', () => {
    updateSW(true); // Reload page after update
  });

  // Handle dismiss button click
  const dismissBtn = document.getElementById('sw-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 30000);
}

/**
 * Show offline ready notification
 */
function showOfflineReadyNotification() {
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'sw-offline-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 22, 40, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 0.75rem;
    padding: 1rem 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="color: #10B981; font-size: 1.25rem;">✓</div>
    <div style="color: #E5E7EB; font-size: 0.875rem; flex: 1;">
      App ready to work offline
    </div>
    <button id="sw-offline-dismiss-btn" style="
      background: transparent;
      color: #9CA3AF;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    ">
      ×
    </button>
  `;

  document.body.appendChild(notification);

  // Handle dismiss button click
  const dismissBtn = document.getElementById('sw-offline-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
  });

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}
