import { useEffect, useRef, useState } from 'react';
import { BarcodeScanner as Scanner } from '../utils/barcode-scanner';
import styles from './BarcodeScanner.module.css';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  onError?: (error: string) => void;
  onManualInput?: () => void;
}

type PermissionState = 'prompt' | 'requesting' | 'granted' | 'denied';

function BarcodeScanner({ onScan, onClose, onError, onManualInput }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<Scanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  const startCamera = async () => {
    if (!videoRef.current) return;

    setPermissionState('requesting');
    setIsLoading(true);

    const scanner = new Scanner();
    scannerRef.current = scanner;

    scanner.startScanning(videoRef.current, {
      onResult: (result) => {
        onScan(result.code);
        scanner.stopScanning();
      },
      onError: (err) => {
        const errorMessage = err.message;
        
        // Check if it's a permission error
        if (errorMessage.includes('Permission denied') || 
            errorMessage.includes('NotAllowedError') ||
            errorMessage.includes('permission')) {
          setPermissionState('denied');
          setError('Camera access was denied. Please allow camera access to scan barcodes.');
        } else {
          setPermissionState('granted');
          setError(errorMessage);
        }
        
        setIsLoading(false);
        if (onError) {
          onError(errorMessage);
        }
      },
    });

    // Video loaded
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      setIsLoading(false);
      setPermissionState('granted');
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      scanner.stopScanning();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stopScanning();
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning();
    }
    onClose();
  };

  const handleManualInput = () => {
    handleClose();
    if (onManualInput) {
      onManualInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Barcode scanner"
      aria-modal="true"
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Scan Barcode</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close scanner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.videoContainer}>
          {/* Permission prompt state */}
          {permissionState === 'prompt' && (
            <div className={styles.permissionPrompt}>
              <svg 
                className={styles.cameraIcon}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <h3 className={styles.permissionTitle}>Camera Access Required</h3>
              <p className={styles.permissionDescription}>
                We need access to your camera to scan barcodes. Your camera feed is processed locally and never stored.
              </p>
              <div className={styles.permissionActions}>
                <button 
                  className={styles.allowButton} 
                  onClick={startCamera}
                  aria-label="Allow camera access"
                >
                  Allow Camera Access
                </button>
                <button 
                  className={styles.fallbackButton} 
                  onClick={handleManualInput}
                  aria-label="Enter barcode manually"
                >
                  Enter Manually Instead
                </button>
              </div>
            </div>
          )}

          {/* Requesting permission / loading state */}
          {(permissionState === 'requesting' || isLoading) && (
            <div className={styles.loading}>
              <div className={styles.spinner} aria-label="Loading camera" />
              <p>Starting camera...</p>
            </div>
          )}

          {/* Camera granted and active */}
          {permissionState === 'granted' && !error && (
            <>
              <video
                ref={videoRef}
                className={styles.video}
                playsInline
                muted
                aria-label="Camera feed for barcode scanning"
              />
              {!isLoading && (
                <div className={styles.scanFrame}>
                  <div className={styles.corner} style={{ top: 0, left: 0 }} />
                  <div className={styles.corner} style={{ top: 0, right: 0 }} />
                  <div className={styles.corner} style={{ bottom: 0, left: 0 }} />
                  <div className={styles.corner} style={{ bottom: 0, right: 0 }} />
                </div>
              )}
            </>
          )}

          {/* Permission denied state */}
          {permissionState === 'denied' && (
            <div className={styles.error} role="alert">
              <svg 
                className={styles.errorIcon}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <h3 className={styles.errorTitle}>Camera Access Denied</h3>
              <p className={styles.errorDescription}>
                {error || 'Camera access was denied. To scan barcodes, please allow camera access in your browser settings.'}
              </p>
              <div className={styles.fallbackActions}>
                <button 
                  className={styles.fallbackButton} 
                  onClick={handleManualInput}
                  aria-label="Enter barcode manually"
                >
                  Enter Barcode Manually
                </button>
                <button 
                  className={styles.secondaryButton} 
                  onClick={startCamera}
                  aria-label="Try camera again"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Other errors (not permission related) */}
          {error && permissionState === 'granted' && (
            <div className={styles.error} role="alert">
              <svg 
                className={styles.errorIcon}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <h3 className={styles.errorTitle}>Scanner Error</h3>
              <p className={styles.errorDescription}>{error}</p>
              <div className={styles.fallbackActions}>
                <button 
                  className={styles.fallbackButton} 
                  onClick={handleManualInput}
                  aria-label="Enter barcode manually"
                >
                  Enter Manually Instead
                </button>
              </div>
            </div>
          )}
        </div>

        {permissionState === 'granted' && !error && (
          <p className={styles.instructions}>
            Position the barcode within the frame
          </p>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;
