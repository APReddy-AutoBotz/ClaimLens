import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScanHistory } from '../hooks/useScanHistory';
import { VerdictBadge } from '../components/VerdictBadge';
import { getVerdict } from '../../../../packages/core/trust-score';
import styles from './History.module.css';

type VerdictFilter = 'all' | 'allow' | 'caution' | 'avoid';
type CategoryFilter = 'all' | 'allergens' | 'banned_claims' | 'missing_disclaimers' | 'weasel_words' | 'recall_signals';
type DateFilter = 'all' | 'today' | 'week' | 'month';

// Helper function to get source icon
function getSourceIcon(sourceType: 'url' | 'screenshot' | 'barcode' | 'text'): string {
  switch (sourceType) {
    case 'url': return '🌐';
    case 'screenshot': return '📸';
    case 'barcode': return '📊';
    case 'text': return '📝';
    default: return '🔍';
  }
}

// Helper function to get source type label
function getSourceTypeLabel(sourceType: 'url' | 'screenshot' | 'barcode' | 'text'): string {
  switch (sourceType) {
    case 'url': return 'Web URL';
    case 'screenshot': return 'Screenshot';
    case 'barcode': return 'Barcode';
    case 'text': return 'Text';
    default: return 'Scan';
  }
}

function History() {
  const navigate = useNavigate();
  const { history, clearHistory, renameScan } = useScanHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter history based on search, verdict, category, and date
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.productName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVerdict =
      verdictFilter === 'all' || item.verdict === verdictFilter;
    
    // Category filter
    const matchesCategory =
      categoryFilter === 'all' ||
      (item.categories && item.categories.includes(categoryFilter));
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = Date.now();
      const itemDate = item.timestamp;
      const diffMs = now - itemDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (dateFilter === 'today') {
        matchesDate = diffDays < 1;
      } else if (dateFilter === 'week') {
        matchesDate = diffDays < 7;
      } else if (dateFilter === 'month') {
        matchesDate = diffDays < 30;
      }
    }
    
    return matchesSearch && matchesVerdict && matchesCategory && matchesDate;
  });

  const handleItemClick = (item: typeof history[0]) => {
    // Navigate to results page with cached data
    navigate(`/results?data=${item.resultData}`);
  };

  const handleQuickRescan = (e: React.MouseEvent, item: typeof history[0]) => {
    e.stopPropagation(); // Prevent triggering the item click
    // Navigate to results page - user can then click "Scan Another" to re-scan
    navigate(`/results?data=${item.resultData}`);
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  const handleRename = (e: React.MouseEvent, itemId: string, currentName: string) => {
    e.stopPropagation(); // Prevent triggering the item click
    const newName = prompt('Enter product name:', currentName || '');
    if (newName && newName.trim() && newName !== currentName) {
      renameScan(itemId, newName.trim());
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Scan History</h1>
        <p className={styles.description}>
          {history.length} scan{history.length !== 1 ? 's' : ''} saved (max 50)
        </p>
      </div>

      {history.length > 0 && (
        <>
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search scan history"
              />
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Verdict</label>
              <div className={styles.filters}>
                <button
                  className={`${styles.filterButton} ${
                    verdictFilter === 'all' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setVerdictFilter('all')}
                  aria-pressed={verdictFilter === 'all'}
                >
                  All
                </button>
                <button
                  className={`${styles.filterButton} ${
                    verdictFilter === 'allow' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setVerdictFilter('allow')}
                  aria-pressed={verdictFilter === 'allow'}
                >
                  Allow
                </button>
                <button
                  className={`${styles.filterButton} ${
                    verdictFilter === 'caution' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setVerdictFilter('caution')}
                  aria-pressed={verdictFilter === 'caution'}
                >
                  Caution
                </button>
                <button
                  className={`${styles.filterButton} ${
                    verdictFilter === 'avoid' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setVerdictFilter('avoid')}
                  aria-pressed={verdictFilter === 'avoid'}
                >
                  Avoid
                </button>
              </div>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Category</label>
              <div className={styles.filters}>
                <button
                  className={`${styles.filterButton} ${
                    categoryFilter === 'all' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setCategoryFilter('all')}
                  aria-pressed={categoryFilter === 'all'}
                >
                  All
                </button>
                <button
                  className={`${styles.filterButton} ${
                    categoryFilter === 'allergens' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setCategoryFilter('allergens')}
                  aria-pressed={categoryFilter === 'allergens'}
                >
                  Allergens
                </button>
                <button
                  className={`${styles.filterButton} ${
                    categoryFilter === 'banned_claims' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setCategoryFilter('banned_claims')}
                  aria-pressed={categoryFilter === 'banned_claims'}
                >
                  Banned Claims
                </button>
                <button
                  className={`${styles.filterButton} ${
                    categoryFilter === 'weasel_words' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setCategoryFilter('weasel_words')}
                  aria-pressed={categoryFilter === 'weasel_words'}
                >
                  Weasel Words
                </button>
              </div>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Date</label>
              <div className={styles.filters}>
                <button
                  className={`${styles.filterButton} ${
                    dateFilter === 'all' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setDateFilter('all')}
                  aria-pressed={dateFilter === 'all'}
                >
                  All Time
                </button>
                <button
                  className={`${styles.filterButton} ${
                    dateFilter === 'today' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setDateFilter('today')}
                  aria-pressed={dateFilter === 'today'}
                >
                  Today
                </button>
                <button
                  className={`${styles.filterButton} ${
                    dateFilter === 'week' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setDateFilter('week')}
                  aria-pressed={dateFilter === 'week'}
                >
                  This Week
                </button>
                <button
                  className={`${styles.filterButton} ${
                    dateFilter === 'month' ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => setDateFilter('month')}
                  aria-pressed={dateFilter === 'month'}
                >
                  This Month
                </button>
              </div>
            </div>

            <button
              className={styles.clearButton}
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear all scan history"
            >
              Clear History
            </button>
          </div>

          {filteredHistory.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>
                No scans match your search or filter.
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredHistory.map((item) => {
                const verdict = getVerdict(item.trustScore);
                const productName = item.productIdentity?.name || item.productName;
                const isUnknown = !productName || productName === 'Unknown Item';
                
                return (
                  <div key={item.id} className={styles.itemWrapper}>
                    <button
                      className={styles.item}
                      onClick={() => handleItemClick(item)}
                      aria-label={`View scan results for ${productName}`}
                    >
                      {item.thumbnail && (
                        <div className={styles.thumbnail}>
                          <img
                            src={item.thumbnail}
                            alt=""
                            className={styles.thumbnailImage}
                          />
                        </div>
                      )}
                      <div className={styles.itemContent}>
                        <div className={styles.itemHeader}>
                          <h3 className={`${styles.itemName} ${isUnknown ? styles.unknownItem : ''}`}>
                            {productName}
                          </h3>
                          {isUnknown && (
                            <button
                              className={styles.renameButton}
                              onClick={(e) => handleRename(e, item.id, productName)}
                              aria-label="Rename product"
                              title="Rename product"
                            >
                              ✏️ Rename
                            </button>
                          )}
                        </div>
                        {item.productIdentity && (item.productIdentity.brand || item.productIdentity.category) && (
                          <div className={styles.itemBrandCategory}>
                            {item.productIdentity.brand && (
                              <span className={styles.itemBrand}>{item.productIdentity.brand}</span>
                            )}
                            {item.productIdentity.brand && item.productIdentity.category && (
                              <span className={styles.itemSeparator}>•</span>
                            )}
                            {item.productIdentity.category && (
                              <span className={styles.itemCategory}>{item.productIdentity.category}</span>
                            )}
                          </div>
                        )}
                        <div className={styles.itemMeta}>
                          {item.productIdentity && (
                            <span className={styles.itemSource}>
                              <span className={styles.sourceIcon} aria-hidden="true">
                                {getSourceIcon(item.productIdentity.sourceType)}
                              </span>
                              <span className={styles.sourceLabel}>
                                {item.productIdentity.sourceLabel || getSourceTypeLabel(item.productIdentity.sourceType)}
                              </span>
                            </span>
                          )}
                          <span className={styles.itemScore}>
                            Score: {item.trustScore}
                          </span>
                          <span className={styles.itemTimestamp}>
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.itemVerdict}>
                        <VerdictBadge verdict={verdict} compact />
                      </div>
                    </button>
                    <button
                      className={styles.rescanButton}
                      onClick={(e) => handleQuickRescan(e, item)}
                      aria-label={`View details for ${productName}`}
                      title="View details"
                    >
                      <span className={styles.rescanIcon}>👁️</span>
                      <span className={styles.rescanText}>View</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {history.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h2 className={styles.emptyTitle}>No Scan History</h2>
          <p className={styles.emptyText}>
            Your scanned products will appear here. Start scanning to build your
            history!
          </p>
          <button
            className={styles.scanButton}
            onClick={() => navigate('/scan')}
          >
            Go to Scan Hub
          </button>
        </div>
      )}

      {showClearConfirm && (
        <div
          className={styles.modal}
          onClick={() => setShowClearConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-confirm-title"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="clear-confirm-title" className={styles.modalTitle}>
              Clear All History?
            </h2>
            <p className={styles.modalText}>
              This will permanently delete all {history.length} scan
              {history.length !== 1 ? 's' : ''} from your history. This action
              cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalButtonCancel}
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalButtonConfirm}
                onClick={handleClearHistory}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
