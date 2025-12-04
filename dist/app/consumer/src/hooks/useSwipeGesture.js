import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Hook to enable swipe-right gesture for navigation back
 * @param options Configuration options
 */
export function useSwipeGesture(options = {}) {
    const { threshold = 100, enabled = true } = options;
    const navigate = useNavigate();
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    useEffect(() => {
        if (!enabled)
            return;
        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };
        const handleTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX.current;
            const deltaY = touchEndY - touchStartY.current;
            // Only trigger if horizontal swipe is dominant and exceeds threshold
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > threshold) {
                // Swipe right detected - go back
                navigate(-1);
            }
        };
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, threshold, navigate]);
}
