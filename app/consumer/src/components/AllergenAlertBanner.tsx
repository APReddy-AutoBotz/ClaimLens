import { Link } from 'react-router-dom';
import styles from './AllergenAlertBanner.module.css';

interface AllergenAlertBannerProps {
  detectedAllergens: string[];
}

export function AllergenAlertBanner({ detectedAllergens }: AllergenAlertBannerProps) {
  if (detectedAllergens.length === 0) {
    return null;
  }

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <div className={styles.iconContainer}>
        <span className={styles.icon} aria-hidden="true">⚠️</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>Allergen Alert</h3>
        <p className={styles.message}>
          This product contains allergens from your profile:{' '}
          <strong className={styles.allergenList}>
            {detectedAllergens.join(', ')}
          </strong>
        </p>
        <p className={styles.why}>
          Based on your allergen profile. Always verify labels directly.
        </p>
      </div>
      <Link to="/settings" className={styles.editLink}>
        Edit profile →
      </Link>
    </div>
  );
}
