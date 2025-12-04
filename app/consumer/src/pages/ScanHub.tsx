import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputSelector from '../components/InputSelector';
import BarcodeScanner from '../components/BarcodeScanner';
import ExtractedTextEditor from '../components/ExtractedTextEditor';
import ScanProgress, { ScanStage } from '../components/ScanProgress';
import { SpectralScan, type ScanStep } from '../components/SpectralScan';
import { calculateTrustScore } from '../lib/trust-score';
import { generateScanSteps } from '../lib/scanSteps';
import { useAllergenProfile } from '../hooks/useAllergenProfile';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { lookupBarcode, ProductData } from '../utils/open-food-facts';
import { queueScan } from '../utils/background-sync';
import { extractTextFromImage, validateImageFile } from '../utils/ocr';
import { requestCache } from '../utils/request-cache';
import { buildApiUrl, isInDemoMode } from '../utils/api-config';
import type { ProductIdentity } from '../types';
import { generateDisplayName } from '../lib/displayName';
import styles from './ScanHub.module.css';

type InputMethod = 'url' | 'screenshot' | 'barcode' | 'text';

/**
 * Generate ProductIdentity from scan inputs with smart name extraction
 */
function generateProductIdentity(
  method: InputMethod,
  urlInput: string,
  textInput: string,
  extractedText: string | null,
  _barcodeData: ProductData | null, // Kept for API compatibility but unused
  barcodeCode: string | null,
  apiProductInfo?: { product_name?: string; brand?: string; category?: string }
): ProductIdentity {
  // Generate meaningful display name using smart extraction
  const name = generateDisplayName({
    method,
    urlInput,
    textInput,
    barcodeCode: barcodeCode || undefined,
    extractedText: extractedText || undefined,
    apiProductName: apiProductInfo?.product_name,
  });
  
  let brand: string | undefined;
  let category: string | undefined;
  let sourceLabel: string | undefined;

  switch (method) {
    case 'url':
      try {
        const urlObj = new URL(urlInput);
        sourceLabel = urlObj.hostname;
      } catch {
        sourceLabel = 'web';
      }
      brand = apiProductInfo?.brand;
      category = apiProductInfo?.category;
      break;

    case 'barcode':
      brand = apiProductInfo?.brand;
      category = apiProductInfo?.category;
      sourceLabel = barcodeCode ? `UPC ${barcodeCode}` : 'barcode scan';
      break;

    case 'screenshot':
      brand = apiProductInfo?.brand;
      category = apiProductInfo?.category;
      sourceLabel = 'photo';
      break;

    case 'text':
      brand = apiProductInfo?.brand;
      category = apiProductInfo?.category;
      sourceLabel = 'manual entry';
      break;
  }

  return {
    name,
    brand,
    category,
    sourceType: method,
    sourceLabel,
  };
}

// Blocked domains for security
const BLOCKED_DOMAINS = ['localhost', '127.0.0.1', '0.0.0.0', 'internal', 'admin'];

function ScanHub() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { getAllergenCount, getAllAllergens } = useAllergenProfile();
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');
  const [textError, setTextError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeData, setBarcodeData] = useState<ProductData | null>(null);
  const [barcodeCode, setBarcodeCode] = useState<string | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [scanError, setScanError] = useState<string | undefined>(undefined);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [spectralSteps, setSpectralSteps] = useState<ScanStep[]>([]);
  const [showSpectralScan, setShowSpectralScan] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError("That URL doesn't look right. Try pasting a product page link.");
      return false;
    }
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setUrlError("That URL doesn't look right. Try pasting a product page link.");
        return false;
      }
      
      // Check for blocked domains
      const hostname = urlObj.hostname.toLowerCase();
      if (BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked))) {
        setUrlError("We can't access that site. Try a screenshot instead.");
        return false;
      }
      
      setUrlError('');
      return true;
    } catch {
      setUrlError("That URL doesn't look right. Try pasting a product page link.");
      return false;
    }
  };

  const validateText = (text: string): boolean => {
    if (!text.trim()) {
      setTextError('Text is required');
      return false;
    }
    const sizeInBytes = new Blob([text]).size;
    const maxSize = 10 * 1024; // 10KB
    if (sizeInBytes > maxSize) {
      setTextError(`Text is too large (${Math.round(sizeInBytes / 1024)}KB). Maximum is 10KB.`);
      return false;
    }
    setTextError('');
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setOcrError(validation.error || "Couldn't read that image. Try a clearer photo or paste text.");
      return;
    }

    setScreenshotFile(file);
    setOcrError(null);
    setExtractedText(null);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result as string;
      setScreenshotPreview(imageData);

      // Extract text automatically
      setIsExtractingText(true);
      setScanStage('extract');
      try {
        const result = await extractTextFromImage(imageData);
        
        if (!result.text || result.text.trim().length === 0) {
          setOcrError("Couldn't read that image. Try a clearer photo or paste text.");
          setScanStage('error');
          return;
        }

        setExtractedText(result.text);
        setShowTextEditor(true);
        setScanStage('idle');
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't read that image. Try a clearer photo or paste text.";
        setOcrError(message);
        setScanStage('error');
      } finally {
        setIsExtractingText(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setBarcodeCode(barcode); // Store barcode for display name generation
    setIsLoadingBarcode(true);
    setBarcodeError(null);
    setCameraPermissionDenied(false);

    try {
      const productData = await lookupBarcode(barcode);
      
      if (!productData) {
        setBarcodeError('Product not found - Try manual input');
        return;
      }

      setBarcodeData(productData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to lookup barcode';
      setBarcodeError(message);
    } finally {
      setIsLoadingBarcode(false);
    }
  };

  const handleBarcodeScannerError = (error: string) => {
    if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('denied')) {
      setCameraPermissionDenied(true);
      setBarcodeError('Camera access denied. Please enable camera permissions in your browser settings, or try another scan method.');
    } else {
      setBarcodeError(error);
    }
  };

  const handleScan = async () => {
    let isValid = false;
    let inputData = '';

    switch (selectedMethod) {
      case 'url':
        isValid = validateUrl(urlInput);
        inputData = urlInput;
        break;
      case 'text':
        isValid = validateText(textInput);
        inputData = textInput;
        break;
      case 'screenshot':
        // Use extracted text if available
        if (extractedText) {
          isValid = true;
          inputData = extractedText;
        } else {
          isValid = false;
        }
        break;
      case 'barcode':
        if (!barcodeData) {
          setShowBarcodeScanner(true);
          return;
        }
        isValid = true;
        // Format barcode data as text for analysis
        inputData = `Product: ${barcodeData.name}\n`;
        if (barcodeData.ingredients) {
          inputData += `Ingredients: ${barcodeData.ingredients}\n`;
        }
        if (barcodeData.allergens && barcodeData.allergens.length > 0) {
          inputData += `Allergens: ${barcodeData.allergens.join(', ')}\n`;
        }
        break;
    }

    if (!isValid || !selectedMethod) return;

    setIsScanning(true);
    setScanError(undefined);
    setScanStage('extract');
    setShowSpectralScan(false);

    try {
      const allergenProfile = getAllAllergens();

      // If offline, queue the scan
      if (!isOnline) {
        queueScan({
          inputType: selectedMethod,
          inputData,
          locale: 'en-US',
          allergenProfile: allergenProfile.length > 0 ? allergenProfile : undefined
        });

        alert('Connection issue. Your scan will resume when you\'re back online.');
        
        // Reset form
        setSelectedMethod(null);
        setUrlInput('');
        setTextInput('');
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setBarcodeData(null);
        setScanStage('idle');
        
        return;
      }

      // Brief extraction phase
      await new Promise(resolve => setTimeout(resolve, 300));

      // In demo mode, use local analysis instead of API
      let result: any;
      
      if (isInDemoMode()) {
        console.log('[Demo Mode] Using local analysis - no backend available');
        // Perform local analysis using local transforms
        const { detectWeaselWords } = await import('../lib/detect-weasel-words');
        const weaselResult = detectWeaselWords(inputData);
        
        // Check for banned claims patterns
        const bannedPatterns = [
          /miracle|superfood|detox|cleanse|cure|heal|treat|prevent/gi,
          /clinically proven|doctor recommended|lab tested/gi,
          /lose.*\d+.*pounds|burn.*fat|melt.*fat/gi,
          /boost.*immun|prevent.*cold|prevent.*flu/gi,
        ];
        
        const bannedClaims: string[] = [];
        for (const pattern of bannedPatterns) {
          const matches = inputData.match(pattern);
          if (matches) {
            bannedClaims.push(...matches);
          }
        }
        
        // Calculate trust score locally
        const { calculateTrustScore: calcScore } = await import('../lib/trust-score');
        const scoreResult = calcScore({
          bannedClaimsCount: bannedClaims.length,
          hasRecall: false,
          userAllergensCount: 0,
          weaselWordDensity: weaselResult.density,
        });
        
        // Determine verdict
        let verdict: { label: 'allow' | 'caution' | 'avoid'; color: string; icon: string; explanation: string };
        if (scoreResult.score >= 80) {
          verdict = { label: 'allow', color: '#10B981', icon: '✓', explanation: 'No policy violations found in checks we ran.' };
        } else if (scoreResult.score >= 50) {
          verdict = { label: 'caution', color: '#F59E0B', icon: '⚠️', explanation: 'Some concerns detected. Review the issues below.' };
        } else {
          verdict = { label: 'avoid', color: '#EF4444', icon: '✕', explanation: 'Multiple policy violations detected.' };
        }
        
        // Build badges
        const badges: Array<{ kind: 'danger' | 'warn' | 'info'; label: string; explanation: string; source?: string }> = [];
        if (bannedClaims.length > 0) {
          badges.push({
            kind: 'danger',
            label: 'Banned Claims',
            explanation: `Found ${bannedClaims.length} prohibited claim(s): ${bannedClaims.slice(0, 3).join(', ')}`,
            source: 'https://fssai.gov.in/cms/food-safety-and-standards-regulations.php',
          });
        }
        if (weaselResult.density > 0.05) {
          badges.push({
            kind: 'warn',
            label: 'Weasel Words',
            explanation: `Contains vague marketing language (${Math.round(weaselResult.density * 100)}% density)`,
          });
        }
        
        // Extract product name from input for demo mode
        const extractedProductName = (() => {
          if (selectedMethod === 'text' && textInput) {
            const firstLine = textInput.split('\n').map(l => l.trim()).filter(Boolean)[0];
            return firstLine && firstLine.length <= 50 ? firstLine : (firstLine?.substring(0, 47) + '...');
          }
          if (selectedMethod === 'screenshot' && extractedText) {
            const firstLine = extractedText.split('\n').map(l => l.trim()).filter(Boolean)[0];
            return firstLine && firstLine.length <= 50 ? firstLine : (firstLine?.substring(0, 47) + '...');
          }
          return undefined;
        })();

        result = {
          trust_score: scoreResult.score,
          verdict,
          badges,
          reasons: [],
          suggestions: [],
          correlation_id: `demo_${Date.now()}`,
          product_info: {
            product_name: extractedProductName,
            claims: bannedClaims,
          },
          breakdown: scoreResult.breakdown,
        };
      } else {
        // Call the consumer scan API with caching
        result = await requestCache.fetch(
          buildApiUrl('/v1/consumer/scan'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input_type: selectedMethod,
              input_data: inputData,
              locale: 'en-US',
              allergen_profile: allergenProfile.length > 0 ? allergenProfile : undefined,
            }),
          },
          2 * 60 * 1000 // Cache for 2 minutes
        );
      }

      // Generate spectral scan steps from result
      const steps = generateScanSteps(selectedMethod, result);
      
      // Set steps to "scanning" status initially
      const scanningSteps = steps.map(step => ({ ...step, status: 'scanning' as const }));
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔬 Setting spectral steps:', scanningSteps.length, 'steps');
        console.log('🔬 isScanning:', true);
      }
      setSpectralSteps(scanningSteps);
      setShowSpectralScan(true);
      setScanStage('checks');
      
      // Wait for spectral scan animation to complete
      await new Promise(resolve => setTimeout(resolve, steps.length * 400 + 500));
      
      // Update steps with final status
      setSpectralSteps(steps);
      setScanStage('verdict');
      
      // Brief verdict display
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use breakdown from result if available (demo mode), otherwise calculate default
      const breakdown = result.breakdown || calculateTrustScore({
        bannedClaimsCount: 0,
        hasRecall: false,
        userAllergensCount: 0,
        weaselWordDensity: 0,
      }).breakdown;

      // Generate product identity with smart name extraction
      const productIdentity = generateProductIdentity(
        selectedMethod,
        urlInput,
        textInput,
        extractedText,
        barcodeData,
        barcodeCode,
        result.product_info
      );

      // Store results in sessionStorage
      const resultWithBreakdown = {
        productIdentity,
        product_info: result.product_info,
        trust_score: result.trust_score,
        verdict: result.verdict,
        badges: result.badges,
        reasons: result.reasons,
        suggestions: result.suggestions,
        correlation_id: result.correlation_id,
        breakdown,
      };
      sessionStorage.setItem('scanResults', JSON.stringify(resultWithBreakdown));

      setScanStage('complete');
      
      // Navigate to results page after brief delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set isScanning to false AFTER navigation starts
      setIsScanning(false);
      navigate('/results');
    } catch (error) {
      console.error('Scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan. Please try again.';
      setScanError(errorMessage);
      setScanStage('error');
      setIsScanning(false);
    }
  };

  const canScan = () => {
    switch (selectedMethod) {
      case 'url':
        return urlInput.trim() !== '' && urlError === '';
      case 'text':
        return textInput.trim() !== '' && textError === '';
      case 'screenshot':
        return extractedText !== null && !isExtractingText;
      case 'barcode':
        return barcodeData !== null;
      default:
        return false;
    }
  };

  const handleTextConfirmed = (text: string) => {
    setExtractedText(text);
    setShowTextEditor(false);
  };

  const handleTextEditorCancel = () => {
    setShowTextEditor(false);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setExtractedText(null);
  };

  const allergenCount = getAllergenCount();

  const handleTryDemo = () => {
    const demoResult = {
      productIdentity: {
        name: 'Immunity Booster Juice',
        brand: 'HealthyLife',
        category: 'Beverages',
        sourceType: 'text' as const,
        sourceLabel: 'demo',
      },
      product_info: {
        product_name: 'Immunity Booster Juice',
        brand: 'HealthyLife',
        category: 'Beverages',
        claims: ['Boosts Immunity', 'Detox Formula', 'Superfood Blend'],
      },
      trust_score: 45,
      verdict: {
        label: 'caution' as const,
        color: '#F59E0B',
        icon: '⚠️',
        explanation: 'Multiple banned health claims detected. Product contains vague marketing language.',
      },
      badges: [
        {
          kind: 'danger' as const,
          label: 'Banned Claim',
          explanation: '"Boosts Immunity" is a prohibited health claim',
          source: 'https://example.com/rules/banned-claims',
        },
        {
          kind: 'warn' as const,
          label: 'Weasel Words',
          explanation: 'Contains vague marketing language like "may help"',
        },
      ],
      reasons: [],
      breakdown: {
        baseScore: 90,
        bannedClaimsDeduction: -30,
        recallDeduction: 0,
        allergenDeduction: 0,
        weaselWordDeduction: -15,
        cleanBonus: 0,
        finalScore: 45,
      },
    };
    
    sessionStorage.setItem('scanResults', JSON.stringify(demoResult));
    navigate('/results');
  };

  return (
    <>
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => {
            setShowBarcodeScanner(false);
            setCameraPermissionDenied(false);
          }}
          onError={handleBarcodeScannerError}
          onManualInput={() => {
            setShowBarcodeScanner(false);
            setSelectedMethod('text');
            setCameraPermissionDenied(false);
          }}
        />
      )}

      {showTextEditor && extractedText && (
        <ExtractedTextEditor
          initialText={extractedText}
          onConfirm={handleTextConfirmed}
          onCancel={handleTextEditorCancel}
          isLoading={isScanning}
        />
      )}
      
      <div className={styles.container}>
        <h1 className={styles.title}>Scan Food Items</h1>
      <p className={styles.description}>
        Paste a product URL or choose another scan method below
      </p>

      {/* Scan Progress Indicator */}
      {(isScanning || scanStage !== 'idle') && (
        <div className={styles.progressSection}>
          <ScanProgress stage={scanStage} error={scanError} />
        </div>
      )}

      {/* Spectral Scan Animation */}
      {showSpectralScan && spectralSteps.length > 0 && (
        <div 
          data-testid="spectral-scan-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <SpectralScan
            steps={spectralSteps}
            isActive={isScanning}
            onComplete={() => {
              console.log('✅ Spectral scan animation complete');
            }}
          />
        </div>
      )}

      {/* Primary URL Input */}
      <div className={styles.primaryInput}>
        <input
          type="url"
          className={styles.urlInputLarge}
          placeholder="Paste a Swiggy/Zomato/Instamart product or menu URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && urlInput.trim()) {
              setSelectedMethod('url');
              handleScan();
            }
          }}
          aria-label="Product URL"
        />
        <button
          className={styles.scanButtonLarge}
          onClick={() => {
            setSelectedMethod('url');
            handleScan();
          }}
          disabled={!urlInput.trim() || isScanning}
        >
          {isScanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {/* Try Demo Button */}
      <div className={styles.demoSection}>
        <button onClick={handleTryDemo} className={styles.demoButton}>
          ✨ Try Demo
        </button>
      </div>

      {allergenCount > 0 && (
        <Link to="/settings" className={styles.allergenBadge}>
          <span className={styles.allergenIcon}>🛡️</span>
          <span className={styles.allergenText}>
            {allergenCount} allergen{allergenCount !== 1 ? 's' : ''} configured
          </span>
        </Link>
      )}

      <div className={styles.divider}>
        <span className={styles.dividerText}>Or choose another method</span>
      </div>

      <InputSelector
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
      />

      {selectedMethod && (
        <div className={`${styles.inputArea} glass-surface`}>
          {selectedMethod === 'url' && (
            <div className={styles.inputGroup}>
              <label htmlFor="url-input" className={styles.label}>
                Enter URL
              </label>
              <input
                id="url-input"
                type="url"
                className={styles.input}
                placeholder="https://example.com/product"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) validateUrl(e.target.value);
                }}
                onBlur={() => urlInput && validateUrl(urlInput)}
                aria-invalid={urlError ? 'true' : 'false'}
                aria-describedby={urlError ? 'url-error' : undefined}
              />
              {urlError && (
                <p id="url-error" className={styles.error} role="alert">
                  {urlError}
                </p>
              )}
            </div>
          )}

          {selectedMethod === 'screenshot' && (
            <div className={styles.inputGroup}>
              <label htmlFor="screenshot-input" className={styles.label}>
                Upload Screenshot
              </label>
              <input
                id="screenshot-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.fileInput}
                onChange={handleFileChange}
                aria-describedby="screenshot-help"
                disabled={isExtractingText}
              />
              <p id="screenshot-help" className={styles.help}>
                Accepted formats: JPG, PNG, WebP (max 5MB)
              </p>

              {isExtractingText && (
                <div className={styles.loadingOcr}>
                  <div className={styles.spinner} aria-label="Extracting text from image" />
                  <p>Extracting text from image...</p>
                </div>
              )}

              {ocrError && (
                <div className={styles.ocrError} role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p>{ocrError}</p>
                </div>
              )}

              {screenshotPreview && !isExtractingText && (
                <div className={styles.preview}>
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className={styles.previewImage}
                  />
                  {extractedText && (
                    <div className={styles.extractedTextPreview}>
                      <p className={styles.extractedLabel}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Text extracted successfully
                      </p>
                      <button
                        className={styles.editTextButton}
                        onClick={() => setShowTextEditor(true)}
                        aria-label="Edit extracted text"
                      >
                        Edit Text
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedMethod === 'text' && (
            <div className={styles.inputGroup}>
              <label htmlFor="text-input" className={styles.label}>
                Paste Text
              </label>
              <textarea
                id="text-input"
                className={styles.textarea}
                placeholder="Paste product description, ingredients list, or menu text here..."
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  if (textError) validateText(e.target.value);
                }}
                onBlur={() => textInput && validateText(textInput)}
                rows={8}
                aria-invalid={textError ? 'true' : 'false'}
                aria-describedby={textError ? 'text-error' : 'text-help'}
              />
              <p id="text-help" className={styles.help}>
                Maximum 10KB of text
              </p>
              {textError && (
                <p id="text-error" className={styles.error} role="alert">
                  {textError}
                </p>
              )}
            </div>
          )}

          {selectedMethod === 'barcode' && (
            <div className={styles.inputGroup}>
              {!barcodeData && !barcodeError && !isLoadingBarcode && (
                <button
                  className={styles.startScanButton}
                  onClick={() => setShowBarcodeScanner(true)}
                  aria-label="Start barcode scanner"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M8 2v20M16 2v20" />
                  </svg>
                  <span>Start Camera</span>
                </button>
              )}

              {isLoadingBarcode && (
                <div className={styles.loadingBarcode}>
                  <div className={styles.spinner} aria-label="Loading product data" />
                  <p>Looking up product...</p>
                </div>
              )}

              {barcodeError && (
                <div className={styles.barcodeError} role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p>{barcodeError}</p>
                  <div className={styles.errorActions}>
                    {!cameraPermissionDenied && (
                      <button
                        className={styles.retryButton}
                        onClick={() => {
                          setBarcodeError(null);
                          setShowBarcodeScanner(true);
                        }}
                      >
                        Try Again
                      </button>
                    )}
                    {cameraPermissionDenied && (
                      <>
                        <button
                          className={styles.fallbackButton}
                          onClick={() => {
                            setBarcodeError(null);
                            setBarcodeData(null);
                            setSelectedMethod('screenshot');
                          }}
                        >
                          Use Screenshot Instead
                        </button>
                        <button
                          className={styles.fallbackButton}
                          onClick={() => {
                            setBarcodeError(null);
                            setBarcodeData(null);
                            setSelectedMethod('text');
                          }}
                        >
                          Paste Text Instead
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {barcodeData && (
                <div className={styles.barcodeResult}>
                  {barcodeData.imageUrl && (
                    <img
                      src={barcodeData.imageUrl}
                      alt={barcodeData.name}
                      className={styles.productImage}
                    />
                  )}
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{barcodeData.name}</h3>
                    {barcodeData.allergens && barcodeData.allergens.length > 0 && (
                      <p className={styles.productAllergens}>
                        <strong>Allergens:</strong> {barcodeData.allergens.join(', ')}
                      </p>
                    )}
                    <p className={styles.productSource}>
                      Data from <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>
                    </p>
                  </div>
                  <button
                    className={styles.changeBarcodeButton}
                    onClick={() => {
                      setBarcodeData(null);
                      setShowBarcodeScanner(true);
                    }}
                    aria-label="Scan different barcode"
                  >
                    Scan Different
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className={styles.scanButton}
            onClick={handleScan}
            disabled={!canScan() || isScanning}
            aria-label="Scan food item"
          >
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      )}

      {/* Privacy Microline */}
      <div className={styles.privacyNote}>
        <span className={styles.privacyIcon}>🔒</span>
        <span>Processed locally by default. Saved only if you choose.</span>
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <Link 
          to="/scan" 
          className={`${styles.navItem} ${styles.navItemActive}`}
          aria-current="page"
        >
          <span className={styles.navIcon}>🔍</span>
          <span>Scan</span>
        </Link>
        <Link to="/history" className={styles.navItem}>
          <span className={styles.navIcon}>📜</span>
          <span>History</span>
        </Link>
        <Link to="/settings" className={styles.navItem}>
          <span className={styles.navIcon}>⚙️</span>
          <span>Settings</span>
          {allergenCount > 0 && (
            <span className={styles.navBadge}>{allergenCount}</span>
          )}
        </Link>
      </nav>
      </div>
    </>
  );
}

export default ScanHub;
