import { useState, useRef, useEffect } from 'react';
import styles from './Settings.module.css';
import AllergenToggle from '../components/AllergenToggle';
import { useAllergenProfile } from '../hooks/useAllergenProfile';

const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
];

const JURISDICTIONS = [
  { value: 'US', label: 'United States (FDA)' },
  { value: 'EU', label: 'European Union (EFSA)' },
  { value: 'UK', label: 'United Kingdom (FSA)' },
  { value: 'CA', label: 'Canada (Health Canada)' },
  { value: 'AU', label: 'Australia (FSANZ)' },
  { value: 'GLOBAL', label: 'Global (All Policies)' },
];

interface AppSettings {
  jurisdiction: string;
  privacySave: boolean;
  reducedMotion: boolean;
}

const SETTINGS_STORAGE_KEY = 'claimlens_app_settings';

function Settings() {
  const {
    profile,
    toggleCommonAllergen,
    addCustomAllergen,
    removeCustomAllergen,
    clearAll,
    exportProfile,
    importProfile,
    getAllergenCount,
  } = useAllergenProfile();

  const [customInput, setCustomInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load app settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    }
    return {
      jurisdiction: 'US',
      privacySave: false,
      reducedMotion: false,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      
      // Apply reduced motion preference to document
      if (settings.reducedMotion) {
        document.documentElement.style.setProperty('--duration-fast', '0.01ms');
        document.documentElement.style.setProperty('--duration-base', '0.01ms');
        document.documentElement.style.setProperty('--duration-slow', '0.01ms');
      } else {
        document.documentElement.style.removeProperty('--duration-fast');
        document.documentElement.style.removeProperty('--duration-base');
        document.documentElement.style.removeProperty('--duration-slow');
      }
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }, [settings]);

  const handleJurisdictionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings((prev) => ({ ...prev, jurisdiction: e.target.value }));
  };

  const handlePrivacySaveToggle = () => {
    setSettings((prev) => ({ ...prev, privacySave: !prev.privacySave }));
  };

  const handleReducedMotionToggle = () => {
    setSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      addCustomAllergen(customInput);
      setCustomInput('');
    }
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAll();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };

  const handleExport = () => {
    exportProfile();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importProfile(file);
      setImportError('');
    } catch (error) {
      setImportError('Failed to import profile. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const allergenCount = getAllergenCount();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>
          Configure your preferences and personalize your experience
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Allergen Profile</h2>
        <p className={styles.sectionDescription}>
          Configure your allergens to personalize scan results
        </p>
        {allergenCount > 0 && (
          <div className={styles.count}>
            {allergenCount} allergen{allergenCount !== 1 ? 's' : ''} configured
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Common Allergens</h2>
        <div className={styles.allergenGrid}>
          {COMMON_ALLERGENS.map((allergen) => (
            <AllergenToggle
              key={allergen}
              allergen={allergen}
              checked={profile.common.includes(allergen)}
              onChange={toggleCommonAllergen}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Custom Allergens</h2>
        <form onSubmit={handleAddCustom} className={styles.customForm}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom allergen..."
            className={styles.customInput}
            maxLength={50}
            aria-label="Custom allergen input"
          />
          <button
            type="submit"
            className={styles.addButton}
            disabled={!customInput.trim()}
            aria-label="Add custom allergen"
          >
            Add
          </button>
        </form>

        {profile.custom.length > 0 && (
          <div className={styles.customList}>
            {profile.custom.map((allergen) => (
              <div key={allergen} className={styles.customItem}>
                <span className={styles.customLabel}>{allergen}</span>
                <button
                  onClick={() => removeCustomAllergen(allergen)}
                  className={styles.removeButton}
                  aria-label={`Remove ${allergen}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage Profile</h2>
        <div className={styles.actions}>
          <button onClick={handleExport} className={styles.actionButton}>
            Export Profile
          </button>
          <button onClick={handleImportClick} className={styles.actionButton}>
            Import Profile
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className={styles.fileInput}
            aria-label="Import profile file"
          />
          <button
            onClick={handleClearAll}
            className={`${styles.actionButton} ${styles.dangerButton}`}
          >
            {showClearConfirm ? 'Confirm Clear All' : 'Clear All'}
          </button>
        </div>
        {showClearConfirm && (
          <p className={styles.confirmText}>
            Click "Confirm Clear All" again to delete all allergens
          </p>
        )}
        {importError && <p className={styles.errorText}>{importError}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Locale & Jurisdiction</h2>
        <p className={styles.sectionDescription}>
          Select which policy packs apply to your scans
        </p>
        <div className={styles.selectWrapper}>
          <label htmlFor="jurisdiction" className={styles.selectLabel}>
            Jurisdiction
          </label>
          <select
            id="jurisdiction"
            value={settings.jurisdiction}
            onChange={handleJurisdictionChange}
            className={styles.select}
            aria-label="Select jurisdiction"
          >
            {JURISDICTIONS.map((jurisdiction) => (
              <option key={jurisdiction.value} value={jurisdiction.value}>
                {jurisdiction.label}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.helperText}>
          This affects which regulatory policies are applied during analysis
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy & Accessibility</h2>
        
        <div className={styles.toggleGroup}>
          <div className={styles.toggleItem}>
            <div className={styles.toggleInfo}>
              <h3 className={styles.toggleTitle}>Save Scan History</h3>
              <p className={styles.toggleDescription}>
                Store your scan results locally for quick access
              </p>
            </div>
            <label className={styles.switchLabel}>
              <input
                type="checkbox"
                checked={settings.privacySave}
                onChange={handlePrivacySaveToggle}
                className={styles.switchInput}
                aria-label="Toggle save scan history"
              />
              <span className={styles.switch} />
            </label>
          </div>

          <div className={styles.toggleItem}>
            <div className={styles.toggleInfo}>
              <h3 className={styles.toggleTitle}>Reduced Motion</h3>
              <p className={styles.toggleDescription}>
                Minimize animations and transitions for accessibility
              </p>
            </div>
            <label className={styles.switchLabel}>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={handleReducedMotionToggle}
                className={styles.switchInput}
                aria-label="Toggle reduced motion"
              />
              <span className={styles.switch} />
            </label>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Your settings and allergen profile are stored locally on your device and never sent to our
          servers unless you explicitly opt in.
        </p>
      </footer>
    </div>
  );
}

export default Settings;
