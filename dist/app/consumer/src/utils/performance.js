/**
 * Performance Optimization Utilities
 * Helpers for optimizing React rendering and API calls
 */
import { useEffect, useRef, useCallback } from 'react';
/**
 * Debounce function calls
 */
export function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
/**
 * Throttle function calls
 */
export function throttle(func, limit) {
    let inThrottle = false;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
/**
 * Hook for debounced value
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
/**
 * Hook for previous value
 */
export function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
/**
 * Hook for stable callback reference
 */
export function useStableCallback(callback) {
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    return useCallback((...args) => {
        return callbackRef.current(...args);
    }, []);
}
/**
 * Measure component render time
 */
export function measureRender(componentName) {
    if (process.env.NODE_ENV === 'development') {
        const start = performance.now();
        return () => {
            const end = performance.now();
            const duration = end - start;
            if (duration > 16) {
                // Warn if render takes longer than one frame (16ms)
                console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
            }
        };
    }
    return () => { };
}
/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(imgElement, src, options) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                imgElement.src = src;
                observer.unobserve(imgElement);
            }
        });
    }, options);
    observer.observe(imgElement);
    return () => {
        observer.unobserve(imgElement);
    };
}
/**
 * Preload critical resources
 */
export function preloadResource(href, as) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
}
export function reportWebVitals(onPerfEntry) {
    if (onPerfEntry && typeof window !== 'undefined') {
        // Optional: Install web-vitals package for detailed metrics
        // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        //   getCLS(onPerfEntry as any);
        //   getFID(onPerfEntry as any);
        //   getFCP(onPerfEntry as any);
        //   getLCP(onPerfEntry as any);
        //   getTTFB(onPerfEntry as any);
        // });
        console.log('Web Vitals reporting available with web-vitals package');
    }
}
/**
 * Optimize images for web
 */
export async function optimizeImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.9) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result;
        };
        img.onload = () => {
            let { width, height } = img;
            // Calculate new dimensions
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            // Create canvas and resize
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/jpeg', quality);
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        reader.readAsDataURL(file);
    });
}
// Fix missing React import
import React from 'react';
