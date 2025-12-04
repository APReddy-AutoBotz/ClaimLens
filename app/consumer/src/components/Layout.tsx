import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOnlineStatus } from '@hooks/useOnlineStatus';
import { useSwipeGesture } from '@hooks/useSwipeGesture';
import { useNavigationShortcuts } from '@hooks/useKeyboardShortcuts';
import SyncStatus from './SyncStatus';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  
  // Enable swipe-to-go-back gesture on mobile
  useSwipeGesture({ enabled: true, threshold: 100 });
  
  // Enable keyboard shortcuts
  useNavigationShortcuts();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {!isOnline && (
        <div className={styles.offlineBanner} role="alert" aria-live="polite">
          <svg className={styles.offlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
          <span>Offline mode - Some features unavailable</span>
        </div>
      )}
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>
            <Link to="/">ClaimLens Go</Link>
          </h1>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        {children}
      </main>

      <SyncStatus />

      <nav className={styles.nav} role="navigation" aria-label="Main navigation">
        <Link 
          to="/scan" 
          className={`${styles.navItem} ${isActive('/scan') ? styles.navItemActive : ''}`}
          aria-current={isActive('/scan') ? 'page' : undefined}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span>Scan</span>
        </Link>

        <Link 
          to="/history" 
          className={`${styles.navItem} ${isActive('/history') ? styles.navItemActive : ''}`}
          aria-current={isActive('/history') ? 'page' : undefined}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
          </svg>
          <span>History</span>
        </Link>

        <Link 
          to="/settings" 
          className={`${styles.navItem} ${isActive('/settings') ? styles.navItemActive : ''}`}
          aria-current={isActive('/settings') ? 'page' : undefined}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
            <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24" />
            <path d="M1 12h6m6 0h6" />
            <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
          </svg>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default Layout;
