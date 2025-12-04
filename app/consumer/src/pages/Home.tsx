import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FloatingFoodCards } from '../components/HeroVisuals';
import { ModeSwitch } from '../components/ModeSwitch';
import { ProofStrip } from '../components/ProofStrip';
import { BusinessModeModal } from '../components/BusinessModeModal';
import styles from './Home.module.css';

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'consumer' | 'business'>('consumer');
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  const handleModeChange = (newMode: 'consumer' | 'business') => {
    setMode(newMode);
    if (newMode === 'business') {
      // Show modal explaining how to access the Admin app
      setShowBusinessModal(true);
      // Reset back to consumer mode
      setMode('consumer');
    }
  };

  const handleTryDemo = () => {
    // Populate demo data and navigate to results
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
      <BusinessModeModal 
        isOpen={showBusinessModal} 
        onClose={() => setShowBusinessModal(false)} 
      />
      
      <div className={styles.container}>
        <div className={styles.hero}>
        {/* Revolutionary Floating Food Cards with Real HD Images */}
        <FloatingFoodCards />

        {/* Mode Switch */}
        <div className={styles.modeSwitch}>
          <ModeSwitch mode={mode} onModeChange={handleModeChange} />
        </div>

        <h1 className={styles.title}>
          ClaimLens Go
        </h1>
        <p className={styles.subtitle}>
          Proof-first checks for risky food claims, allergens, and missing disclaimers — with receipts.
        </p>
        
        {/* Proof Strip */}
        <div className={styles.proofStrip}>
          <ProofStrip />
        </div>

        <div className={styles.ctaGroup}>
          <Link to="/scan" className={styles.ctaButton}>
            Start Scanning
            <span style={{ fontSize: '1.5rem' }}>→</span>
          </Link>
          <button onClick={handleTryDemo} className={styles.ctaButtonSecondary}>
            Try Demo
          </button>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔍</div>
          <h3>4 Ways to Scan</h3>
          <p>URL, Screenshot, Barcode, or Text - choose what works best for you</p>
          <div className={styles.featureMicrocopy}>Flexible input for any workflow</div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Trust Score 0-100</h3>
          <p>Get an instant safety score with detailed breakdown and verdict</p>
          <div className={styles.featureMicrocopy}>Evidence-based scoring</div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>⚠️</div>
          <h3>Allergen Alerts</h3>
          <p>Configure your allergen profile and get personalized warnings</p>
          <div className={styles.featureMicrocopy}>Personalized by your allergen profile</div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔄</div>
          <h3>Safer Alternatives</h3>
          <p>Discover better product options with higher trust scores</p>
          <div className={styles.featureMicrocopy}>Smart recommendations</div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>📱</div>
          <h3>Works Offline</h3>
          <p>Install as PWA and access your scan history even without internet</p>
          <div className={styles.featureMicrocopy}>Progressive web app</div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔒</div>
          <h3>Privacy First</h3>
          <p>All data stays on your device - no tracking, no cloud storage</p>
          <div className={styles.featureMicrocopy}>Processed locally by default</div>
        </div>
      </div>

      <div className={styles.howItWorks}>
        <h2>How It Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepIcon}>📸</div>
            <h4>Scan</h4>
            <p>Choose your input method and scan any food product</p>
            <div className={styles.stepMethods}>URL • Screenshot • Barcode • Text</div>
          </div>
          <div className={styles.stepArrow}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20H30M30 20L23 13M30 20L23 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepIcon}>🔍</div>
            <h4>Analyze</h4>
            <p>We check for banned claims, allergens, and weasel words</p>
            <div className={styles.stepMethods}>Policy Packs • Allergen Profile • Recalls</div>
          </div>
          <div className={styles.stepArrow}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20H30M30 20L23 13M30 20L23 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepIcon}>✓</div>
            <h4>Decide</h4>
            <p>Get a trust score, verdict, and safer alternatives</p>
            <div className={styles.stepMethods}>Allow • Modify • Avoid</div>
          </div>
        </div>
      </div>

      <div className={styles.whatWeCheck}>
        <h2>What We Check / What We Don't</h2>
        
        <div className={styles.expectationCallout}>
          <div className={styles.calloutHeader}>
            <span className={styles.calloutIcon}>ℹ️</span>
            <h3>Setting Expectations</h3>
          </div>
          <p className={styles.calloutText}>
            ClaimLens evaluates <strong>compliance language</strong> against policy packs and your allergen profile. 
            We check for banned claims, missing disclaimers, and recall indicators — not lab adulteration or medical diagnosis.
          </p>
        </div>

        <div className={styles.checksGrid}>
          <div className={styles.checksColumn}>
            <h3 className={styles.checksColumnTitle}>
              <span className={styles.checksColumnIcon}>✓</span>
              What We Check
            </h3>
            <div className={styles.checks}>
              <div className={styles.check}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <strong>Banned Health Claims</strong>
                  <p>Superfood, detox, miracle cure, boosts immunity, burns fat</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <strong>Product Recalls</strong>
                  <p>Cross-referenced with regulatory authority databases</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <strong>Your Allergens</strong>
                  <p>Personalized detection based on your allergen profile</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <strong>Weasel Words</strong>
                  <p>Vague marketing language like "may help" or "supports"</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <strong>Missing Disclaimers</strong>
                  <p>Required legal disclaimers for specific claim types</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.checksColumn}>
            <h3 className={styles.checksColumnTitle}>
              <span className={styles.checksColumnIcon}>✗</span>
              What We Don't Check
            </h3>
            <div className={styles.checks}>
              <div className={styles.check}>
                <span className={styles.checkIconNegative}>✗</span>
                <div>
                  <strong>Lab Testing</strong>
                  <p>We don't test for contaminants, adulteration, or purity</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIconNegative}>✗</span>
                <div>
                  <strong>Medical Diagnosis</strong>
                  <p>Not a substitute for professional medical advice</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIconNegative}>✗</span>
                <div>
                  <strong>Nutritional Quality</strong>
                  <p>We check compliance, not whether food is "healthy"</p>
                </div>
              </div>
              <div className={styles.check}>
                <span className={styles.checkIconNegative}>✗</span>
                <div>
                  <strong>Taste or Quality</strong>
                  <p>No subjective assessments of flavor or freshness</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cta}>
        <h2>Ready to Make Informed Food Choices?</h2>
        <Link to="/scan" className={styles.ctaButton}>
          Start Scanning Now
          <span style={{ fontSize: '1.5rem' }}>→</span>
        </Link>
        <p className={styles.ctaSubtext}>
          Free to use • No account required • Privacy-focused
        </p>
      </div>
    </div>
    </>
  );
}

export default Home;
