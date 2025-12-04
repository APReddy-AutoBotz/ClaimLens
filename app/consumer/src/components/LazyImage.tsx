import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import styles from './LazyImage.module.css';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
}

/**
 * Lazy loading image component with WebP support and loading placeholder
 */
export default function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className = '',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {!isLoaded && (
        <div className={styles.placeholder} aria-hidden="true">
          {placeholder || <div className={styles.skeleton} />}
        </div>
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        onLoad={handleLoad}
        className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
