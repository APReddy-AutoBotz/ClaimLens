import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeGestureOptions {
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook to enable swipe-right gesture for navigation back
 * @param options Configuration options
 */
export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const { threshold = 100, enabled = true } = options;
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
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
