import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Hook to register global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) {
                return;
            }
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey;
                const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey;
                const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey;
                const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
}
/**
 * Hook for common navigation shortcuts
 */
export function useNavigationShortcuts() {
    const navigate = useNavigate();
    useKeyboardShortcuts([
        {
            key: 's',
            action: () => navigate('/scan'),
            description: 'Go to Scan page'
        },
        {
            key: 'h',
            action: () => navigate('/history'),
            description: 'Go to History page'
        }
    ]);
}
