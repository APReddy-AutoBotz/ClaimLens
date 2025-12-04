import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getVerdict } from '../lib/trust-score';
import { IssuesList, type Issue } from '../components/IssuesList';
import { WhyDrawer } from '../components/WhyDrawer';
import { SaferSwaps } from '../components/SaferSwaps';
import { ReceiptsDrawer } from '../components/ReceiptsDrawer';
import { VerdictBanner, type VerdictLabel } from '../components/VerdictBanner';
import { TrustScoreDisplay } from '../components/TrustScoreDisplay';
import { ProofCard } from '../components/ProofCard';
import { ProductHeader } from '../components/ProductHeader';
import { useAllergenProfile } from '../hooks/useAllergenProfile';
import { useScanHistory } from '../hooks/useScanHistory';
import { shareContent, generateShareUrl, encodeResultData, downloadImage } from '../utils/share';
import type { ScanResult } from '../types';
import styles from './Results.module.css';

function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAllAllergens } = useAllergenProfile();
  const { addScan } = useScanHistory();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [showProofCard, setShowProofCard] = useState(false);
  const [proofCardDataUrl, setProofCardDataUrl] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<string>('');

  useEffect(() => {
    // Try to get results from URL params (for shareable links)
    const encodedData = searchParams.get('data');
    
    if (encodedData) {
      try {
        // Decode using decodeURIComponent + atob to match encoding
        const decodedString = decodeURIComponent(atob(encodedData));
        const decodedData = JSON.parse(decodedString);
        setResult(decodedData);
        setLoading(false);
        // Don't auto-save shared results
        setSaveToHistory(false);
      } catch (error) {
        console.error('Failed to decode results data:', error);
        setLoading(false);
      }
    } else {
      // Try to get results from sessionStorage (from scan flow)
      const storedResults = sessionStorage.getItem('scanResults');
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults);
          setResult(parsedResults);
          setLoading(false);
        } catch (error) {
          console.error('Failed to parse stored results:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [searchParams]);

  // Save to history when toggle is enabled
  useEffect(() => {
    if (result && saveToHistory && !savedToHistory) {
      try {
        // Use encodeURIComponent + btoa for safe encoding of Unicode characters
        const jsonString = JSON.stringify(result);
        const encodedData = btoa(encodeURIComponent(jsonString));
        
        // Use productIdentity.name or fallback to "Unknown Item"
        const productName = result.productIdentity?.name || 'Unknown Item';
        
        addScan({
          productName,
          trustScore: result.trust_score,
          verdict: result.verdict.label,
          resultData: encodedData,
          productIdentity: result.productIdentity,
        });
        setSavedToHistory(true);
      } catch (error) {
        console.error('Failed to save scan to history:', error);
      }
    }
  }, [result, saveToHistory, savedToHistory, addScan]);

  const handleScanAnother = () => {
    sessionStorage.removeItem('scanResults');
    navigate('/scan');
  };

  const handleShare = async () => {
    if (!result) return;
    
    setShareStatus('Generating proof card...');
    setShowProofCard(true);
    
    // Wait a bit for the proof card to generate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const encodedData = encodeResultData(result);
    const shareUrl = generateShareUrl(encodedData);
    
    const shareResult = await shareContent({
      title: 'ClaimLens Scan Results',
      text: `Trust Score: ${result.trust_score} - ${verdict.label}`,
      url: shareUrl,
      imageDataUrl: proofCardDataUrl || undefined
    });
    
    if (shareResult.success) {
      if (shareResult.method === 'native') {
        setShareStatus('✓ Shared successfully!');
      } else if (shareResult.method === 'clipboard') {
        setShareStatus('✓ Link copied to clipboard!');
      }
    } else {
      setShareStatus('✗ Share failed. Try again.');
    }
    
    // Clear status after 3 seconds
    setTimeout(() => setShareStatus(''), 3000);
  };
  
  const handleDownloadProofCard = () => {
    if (proofCardDataUrl) {
      const productName = result?.product_info?.product_name || 'scan';
      const filename = `claimlens-${productName.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadImage(proofCardDataUrl, filename);
      setShareStatus('✓ Proof card downloaded!');
      setTimeout(() => setShareStatus(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h1 className={styles.emptyTitle}>No Results Found</h1>
          <p className={styles.emptyText}>
            No scan results found. Please scan a product first.
          </p>
          <button className={styles.button} onClick={handleScanAnother}>
            🔍 Start Scanning
          </button>
        </div>
      </div>
    );
  }

  // Debug: Log the result to see if product_info exists
  if (process.env.NODE_ENV !== 'production') {
    console.log('Scan Result:', result);
    console.log('Product Info:', result.product_info);
  }

  const verdict = getVerdict(result.trust_score);
  const userAllergens = getAllAllergens();
  const hasUserAllergens = userAllergens.length > 0;
  
  // Map verdict label to VerdictBanner format (caution -> modify)
  const verdictLabel: VerdictLabel = verdict.label === 'caution' ? 'modify' : verdict.label as VerdictLabel;
  
  // Combine badges and reasons into issues list
  const issues: Issue[] = [
    ...result.badges,
    ...result.reasons.map(reason => ({
      kind: 'warn' as const,
      label: reason.transform,
      explanation: reason.why,
      source: reason.source,
    })),
  ];
  
  // Get top 2 reasons for proof card
  const topReasons = issues
    .filter(i => i.kind === 'danger' || i.kind === 'warn')
    .slice(0, 2)
    .map(i => i.explanation || i.label);
  
  // Generate receipts URL for QR code
  const receiptsUrl = result.correlation_id 
    ? `${window.location.origin}/results?data=${encodeResultData(result)}#receipts`
    : undefined;

  // Check if any user allergens were detected
  const detectedAllergens = result.user_allergens_detected || [];
  const hasAllergenWarning = hasUserAllergens && detectedAllergens.length > 0;

  // Calculate stats for dashboard
  const issuesCount = issues.filter(i => i.kind === 'danger' || i.kind === 'warn').length;
  const cleanCount = issues.filter(i => i.kind === 'ok').length;
  const totalChecks = issues.length;

  return (
    <div className={styles.container}>
      {/* Dashboard Grid Layout */}
      <div className={styles.dashboardGrid}>
        {/* Product Header - Full Width */}
        <div className={styles.productHeaderWrapper}>
          <ProductHeader productIdentity={result.productIdentity} />
        </div>

        {/* Hero Score Card - Full Width */}
        <div className={styles.heroScoreCard}>
          <div className={styles.scoreLayout}>
            {/* Left: Trust Score Display with Breakdown */}
            <div className={styles.gaugeContainer}>
              <TrustScoreDisplay 
                score={result.trust_score} 
                breakdown={result.breakdown}
              />
              
              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{issuesCount}</span>
                  <span className={styles.statLabel}>Issues</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{cleanCount}</span>
                  <span className={styles.statLabel}>Clean</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{totalChecks}</span>
                  <span className={styles.statLabel}>Checks</span>
                </div>
              </div>
            </div>

            {/* Right: Verdict Banner */}
            <div className={styles.verdictSection}>
              <VerdictBanner
                verdict={verdictLabel}
                score={result.trust_score}
                reason={issuesCount === 0 
                  ? 'No policy violations found in the checks we ran. Based on claim policy + allergen profile + disclaimers rules.'
                  : verdict.explanation}
              />
              
              {hasUserAllergens && (
                <div className={styles.allergenNote}>
                  <span className={styles.allergenNoteIcon}>🛡️</span>
                  <span className={styles.allergenNoteText}>
                    Based on your allergen profile
                  </span>
                  <Link to="/settings" className={styles.editProfileLink}>
                    Edit profile →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Allergen Warning - Full Width Alert */}
        {hasAllergenWarning && (
          <div className={styles.allergenWarning}>
            <div className={styles.warningIcon}>⚠️</div>
            <div className={styles.warningContent}>
              <h3 className={styles.warningTitle}>Allergen Alert</h3>
              <p className={styles.warningText}>
                This product contains allergens from your profile:{' '}
                <strong>{detectedAllergens.join(', ')}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Issues Card - 8 columns */}
        <div className={styles.issuesCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🔍</span>
            Detected Issues
          </h3>
          <IssuesList issues={issues} userAllergens={userAllergens} />
        </div>

        {/* Breakdown Card - 4 columns */}
        {result.breakdown && (
          <div className={styles.breakdownCard}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📊</span>
              Score Breakdown
            </h3>
            <WhyDrawer breakdown={result.breakdown} />
          </div>
        )}

        {/* Safer Swaps - Full Width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SaferSwaps currentScore={result.trust_score} />
        </div>

        {/* Receipts Drawer - Full Width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <ReceiptsDrawer 
            correlationId={result.correlation_id}
            checksRun={totalChecks}
          />
        </div>

        {/* Proof Card (hidden, used for generation) */}
        {showProofCard && (
          <div style={{ position: 'absolute', left: '-9999px' }}>
            <ProofCard
              verdict={verdictLabel}
              score={result.trust_score}
              topReasons={topReasons}
              receiptsUrl={receiptsUrl}
              productName={result.product_info?.product_name}
              onGenerated={setProofCardDataUrl}
            />
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button 
            className={styles.button}
            onClick={handleScanAnother}
          >
            🔍 Scan Another Product
          </button>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleShare}
            disabled={!!shareStatus && shareStatus.includes('Generating')}
          >
            📤 Share Results
          </button>
          {proofCardDataUrl && (
            <button 
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleDownloadProofCard}
            >
              💾 Download Proof Card
            </button>
          )}
        </div>
        
        {/* Share status message */}
        {shareStatus && (
          <div className={styles.shareStatus}>
            {shareStatus}
          </div>
        )}

        {/* History Toggle */}
        <div className={styles.historyToggle}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={saveToHistory}
              onChange={(e) => setSaveToHistory(e.target.checked)}
              className={styles.toggleInput}
              aria-label="Save scan to history"
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleText}>
              {savedToHistory ? '✓ Saved to history' : '💾 Save to history'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default Results;
