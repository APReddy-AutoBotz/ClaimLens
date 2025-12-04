import styles from './InputSelector.module.css';

type InputMethod = 'url' | 'screenshot' | 'barcode' | 'text';

interface InputSelectorProps {
  selectedMethod: InputMethod | null;
  onSelectMethod: (method: InputMethod) => void;
}

function InputSelector({ selectedMethod, onSelectMethod }: InputSelectorProps) {
  const methods = [
    {
      id: 'url' as InputMethod,
      label: 'URL',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      description: 'Paste a product URL'
    },
    {
      id: 'screenshot' as InputMethod,
      label: 'Screenshot',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
      description: 'Upload an image'
    },
    {
      id: 'barcode' as InputMethod,
      label: 'Barcode',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 5v14" />
          <path d="M8 5v14" />
          <path d="M12 5v14" />
          <path d="M17 5v14" />
          <path d="M21 5v14" />
        </svg>
      ),
      description: 'Scan a barcode'
    },
    {
      id: 'text' as InputMethod,
      label: 'Text',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 6.1H3" />
          <path d="M21 12.1H3" />
          <path d="M15.1 18H3" />
        </svg>
      ),
      description: 'Paste text directly'
    }
  ];

  return (
    <div className={styles.container} role="group" aria-label="Select input method">
      {methods.map((method) => (
        <button
          key={method.id}
          className={`${styles.methodButton} ${
            selectedMethod === method.id ? styles.methodButtonActive : ''
          }`}
          onClick={() => onSelectMethod(method.id)}
          aria-pressed={selectedMethod === method.id}
          aria-label={`${method.label}: ${method.description}`}
        >
          <div className={styles.icon}>{method.icon}</div>
          <span className={styles.label}>{method.label}</span>
        </button>
      ))}
    </div>
  );
}

export default InputSelector;
