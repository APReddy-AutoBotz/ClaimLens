import { memo } from 'react';
import type { ProductIdentity } from '../types';
import styles from './ProductHeader.module.css';

interface ProductHeaderProps {
  productIdentity: ProductIdentity;
  onRename?: (newName: string) => void;
}

/**
 * ProductHeader Component
 * Displays product name, brand, category, and source information
 * with optional rename functionality
 */
export const ProductHeader = memo(function ProductHeader({ 
  productIdentity, 
  onRename 
}: ProductHeaderProps) {
  const { name, brand, category, sourceType, sourceLabel } = productIdentity;
  
  // Determine if this is an unknown item
  const isUnknown = !name || name === 'Unknown Item';
  
  // Get source icon based on source type
  const getSourceIcon = (type: ProductIdentity['sourceType']): string => {
    switch (type) {
      case 'url': return '🌐';
      case 'screenshot': return '📸';
      case 'barcode': return '📊';
      case 'text': return '📝';
      default: return '🔍';
    }
  };
  
  // Get source label text
  const getSourceLabel = (): string => {
    if (sourceLabel) return sourceLabel;
    switch (sourceType) {
      case 'url': return 'Web URL';
      case 'screenshot': return 'Screenshot';
      case 'barcode': return 'Barcode Scan';
      case 'text': return 'Text Input';
      default: return 'Scan';
    }
  };
  
  const handleRenameClick = () => {
    if (!onRename) return;
    
    const newName = prompt('Enter product name:', name || '');
    if (newName && newName.trim() && newName !== name) {
      onRename(newName.trim());
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.nameSection}>
          <h1 className={`${styles.productName} ${isUnknown ? styles.unknown : ''}`}>
            {name || 'Unknown Item'}
          </h1>
          
          {(brand || category) && (
            <div className={styles.metadata}>
              {brand && <span className={styles.brand}>{brand}</span>}
              {brand && category && <span className={styles.separator}>•</span>}
              {category && <span className={styles.category}>{category}</span>}
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <div className={styles.sourceChip}>
            <span className={styles.sourceIcon} aria-hidden="true">
              {getSourceIcon(sourceType)}
            </span>
            <span className={styles.sourceLabel}>{getSourceLabel()}</span>
          </div>
          
          {onRename && (
            <button
              className={styles.renameButton}
              onClick={handleRenameClick}
              aria-label="Rename product"
              title="Rename product"
            >
              ✏️ Rename
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
