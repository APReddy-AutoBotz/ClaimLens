import styles from './AllergenToggle.module.css';

interface AllergenToggleProps {
  allergen: string;
  checked: boolean;
  onChange: (allergen: string) => void;
}

function AllergenToggle({ allergen, checked, onChange }: AllergenToggleProps) {
  const handleChange = () => {
    onChange(allergen);
  };

  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className={styles.checkbox}
        aria-label={`Toggle ${allergen} allergen`}
      />
      <span className={styles.slider} />
      <span className={styles.label}>{allergen}</span>
    </label>
  );
}

export default AllergenToggle;
