import { useState, useEffect } from 'react';
const STORAGE_KEY = 'claimlens_scan_history';
const MAX_HISTORY_ITEMS = 50;
export function useScanHistory() {
    const [history, setHistory] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load scan history:', error);
        }
        return [];
    });
    // Persist to localStorage whenever history changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
        catch (error) {
            console.error('Failed to save scan history:', error);
        }
    }, [history]);
    const addScan = (item) => {
        const newItem = {
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
    const removeScan = (id) => {
        setHistory((prev) => prev.filter((item) => item.id !== id));
    };
    const getScanById = (id) => {
        return history.find((item) => item.id === id);
    };
    return {
        history,
        addScan,
        clearHistory,
        removeScan,
        getScanById,
    };
}
