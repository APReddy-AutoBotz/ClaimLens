import { memo } from 'react';
import styles from './ModeSwitch.module.css';

interface ModeSwitchProps {
  mode: 'consumer' | 'business';
  onModeChange: (mode: 'consumer' | 'business') => void;
}

export const ModeSwitch = memo(function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div className={styles.container} role="tablist" aria-label="Application mode">
      <button
        role="tab"
        aria-selected={mode === 'consumer'}
        aria-controls="consumer-panel"
        className={`${styles.tab} ${mode === 'consumer' ? styles.active : ''}`}
        onClick={() => onModeChange('consumer')}
      >
        Consumer
      </button>
      <button
        role="tab"
        aria-selected={mode === 'business'}
        aria-controls="business-panel"
        className={`${styles.tab} ${mode === 'business' ? styles.active : ''}`}
        onClick={() => onModeChange('business')}
      >
        Business
      </button>
      <div 
        className={styles.indicator}
        style={{
          transform: mode === 'business' ? 'translateX(100%)' : 'translateX(0)'
        }}
        aria-hidden="true"
      />
    </div>
  );
});
