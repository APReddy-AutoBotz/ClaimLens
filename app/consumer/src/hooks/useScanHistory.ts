import { useState, useEffect } from 'react';
import type { ProductIdentity } from '../types';

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  trustScore: number;
  verdict: 'allow' | 'caution' | 'avoid';
  thumbnail?: string;
  resultData: string; // Base64 encoded result data for viewing
  categories?: string[]; // Issue categories detected (e.g., 'allergens', 'banned_claims')
  productIdentity?: ProductIdentity; // Product identity information
}

const STORAGE_KEY = 'claimlens_scan_history';
const MAX_HISTORY_ITEMS = 50;

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
    return [];
  });

  // Persist to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  }, [history]);

  const addScan = (item: Omit<ScanHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: ScanHistoryItem = {
      ...item,
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev];
      // Keep only the most recent MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeScan = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const getScanById = (id: string) => {
    return history.find((item) => item.id === id);
  };

  const renameScan = (id: string, newName: string) => {
    setHistory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            productName: newName,
            productIdentity: item.productIdentity
              ? { ...item.productIdentity, name: newName }
              : {
                  name: newName,
                  sourceType: 'text',
                },
          };
        }
        return item;
      })
    );
  };

  return {
    history,
    addScan,
    clearHistory,
    removeScan,
    getScanById,
    renameScan,
  };
}
