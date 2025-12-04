import { memo, useState, useCallback } from 'react';
import styles from './EvidenceDrawer.module.css';

/**
 * Evidence Drawer Component - "No tricks. Just proof."
 * 
 * Displays detailed evidence of the analysis with collapsible sections
 * for rules fired, matched text, and policy references.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

export interface RuleFired {
  id: string;
  name: string;
  description: string;  // Plain English
  severity: 'info' | 'warn' | 'danger';
}

export interface MatchedSnippet {
  text: string;
  highlight: [number, number];  // Start, end indices
  rule: string;
  sourceUrl?: string;
}

export interface PolicyReference {
  packName: string;
  packVersion: string;
  ruleId: string;
  description: string;  // Plain English, non-legal
}

export interface TransformStep {
  name: string;
  duration_ms: number;
  status: 'success' | 'skipped' | 'error';
}

export interface EvidenceDrawerProps {
  correlationId?: string;
  rules: RuleFired[];
  matchedText: MatchedSnippet[];
  policyRefs: PolicyReference[];
  transformChain?: TransformStep[];
  proMode?: boolean;
  totalChecks?: number;
}

export const EvidenceDrawer = memo(function EvidenceDrawer({
  correlationId,
  rules,
  matchedText,
  policyRefs,
  transformChain = [],
  proMode: initialProMode = false,
  totalChecks = 0,
}: EvidenceDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rules: true,
    matchedText: false,
    policyRefs: false,
  });
  const [proMode, setProMode] = useState(initialProMode);

  const toggleDrawer = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  const handleSectionKeyDown = useCallback((e: React.KeyboardEvent, section: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection(section);
    }
  }, [toggleSection]);

  // Calculate summary counts
  const rulesCount = rules.length;
  const matchedCount = matchedText.length;
  const policyCount = policyRefs.length;
  const checksCount = totalChecks || rulesCount + matchedCount;

  // Render highlighted text with the matched portion emphasized
  const renderHighlightedText = (snippet: MatchedSnippet) => {
    const { text, highlight } = snippet;
    const [start, end] = highlight;
    
    if (start < 0 || end > text.length || start >= end) {
      return <span>{text}</span>;
    }

    const before = text.slice(0, start);
    const highlighted = text.slice(start, end);
    const after = text.slice(end);

    return (
      <span>
        {before}
        <mark className={styles.highlight}>{highlighted}</mark>
        {after}
      </span>
    );
  };

  const getSeverityIcon = (severity: RuleFired['severity']) => {
    switch (severity) {
      case 'danger': return '🚫';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <div className={styles.container} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        className={styles.trigger}
        onClick={toggleDrawer}
        aria-expanded={isOpen}
        aria-controls="evidence-content"
      >
        <span className={styles.triggerIcon}>📋</span>
        <div className={styles.triggerContent}>
          <span className={styles.triggerText}>Receipts</span>
          <span className={styles.triggerSubtext}>No tricks. Just proof.</span>
        </div>
        <div className={styles.triggerSummary}>
          <span className={styles.summaryBadge}>{checksCount} checks</span>
        </div>
        <span className={`${styles.triggerArrow} ${isOpen ? styles.arrowOpen : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {/* Drawer Content */}
      {isOpen && (
        <div id="evidence-content" className={styles.content} role="region" aria-label="Evidence details">
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>No tricks. Just proof.</h3>
            <p className={styles.subtitle}>
              Transparent evidence for every decision
            </p>
          </div>

          {/* Meta Info */}
          {correlationId && (
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Request ID</span>
                <code className={styles.metaValue}>{correlationId}</code>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Total Checks</span>
                <span className={styles.metaValue}>{checksCount}</span>
              </div>
            </div>
          )}

          {/* Rules Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('rules')}
              onKeyDown={(e) => handleSectionKeyDown(e, 'rules')}
              aria-expanded={expandedSections.rules}
              aria-controls="rules-section"
            >
              <span className={styles.sectionIcon}>📜</span>
              <span className={styles.sectionTitle}>Rules Fired</span>
              <span className={styles.sectionCount}>{rulesCount}</span>
              <span className={`${styles.sectionArrow} ${expandedSections.rules ? styles.arrowOpen : ''}`}>
                ▼
              </span>
            </button>
            {expandedSections.rules && (
              <div id="rules-section" className={styles.sectionContent}>
                {rules.length === 0 ? (
                  <p className={styles.emptySection}>No rules triggered — all clear!</p>
                ) : (
                  <ul className={styles.rulesList}>
                    {rules.map((rule, idx) => (
                      <li key={rule.id || idx} className={`${styles.ruleItem} ${styles[rule.severity]}`}>
                        <span className={styles.ruleIcon}>{getSeverityIcon(rule.severity)}</span>
                        <div className={styles.ruleContent}>
                          <span className={styles.ruleName}>{rule.name}</span>
                          <span className={styles.ruleDescription}>{rule.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>


          {/* Matched Text Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('matchedText')}
              onKeyDown={(e) => handleSectionKeyDown(e, 'matchedText')}
              aria-expanded={expandedSections.matchedText}
              aria-controls="matched-text-section"
            >
              <span className={styles.sectionIcon}>🔍</span>
              <span className={styles.sectionTitle}>Matched Text</span>
              <span className={styles.sectionCount}>{matchedCount}</span>
              <span className={`${styles.sectionArrow} ${expandedSections.matchedText ? styles.arrowOpen : ''}`}>
                ▼
              </span>
            </button>
            {expandedSections.matchedText && (
              <div id="matched-text-section" className={styles.sectionContent}>
                {matchedText.length === 0 ? (
                  <p className={styles.emptySection}>No specific text matches found</p>
                ) : (
                  <ul className={styles.matchedList}>
                    {matchedText.map((snippet, idx) => (
                      <li key={idx} className={styles.matchedItem}>
                        <div className={styles.matchedSnippet}>
                          <code className={styles.snippetText}>
                            {renderHighlightedText(snippet)}
                          </code>
                        </div>
                        <div className={styles.matchedMeta}>
                          <span className={styles.matchedRule}>Rule: {snippet.rule}</span>
                          {snippet.sourceUrl && (
                            <a 
                              href={snippet.sourceUrl}
                              className={styles.viewSource}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View source →
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Policy References Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('policyRefs')}
              onKeyDown={(e) => handleSectionKeyDown(e, 'policyRefs')}
              aria-expanded={expandedSections.policyRefs}
              aria-controls="policy-refs-section"
            >
              <span className={styles.sectionIcon}>📚</span>
              <span className={styles.sectionTitle}>Policy References</span>
              <span className={styles.sectionCount}>{policyCount}</span>
              <span className={`${styles.sectionArrow} ${expandedSections.policyRefs ? styles.arrowOpen : ''}`}>
                ▼
              </span>
            </button>
            {expandedSections.policyRefs && (
              <div id="policy-refs-section" className={styles.sectionContent}>
                {policyRefs.length === 0 ? (
                  <p className={styles.emptySection}>No policy references to display</p>
                ) : (
                  <ul className={styles.policyList}>
                    {policyRefs.map((ref, idx) => (
                      <li key={idx} className={styles.policyItem}>
                        <div className={styles.policyHeader}>
                          <span className={styles.policyName}>{ref.packName}</span>
                          <span className={styles.policyVersion}>v{ref.packVersion}</span>
                        </div>
                        <p className={styles.policyDescription}>{ref.description}</p>
                        <code className={styles.policyRuleId}>{ref.ruleId}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Pro Mode Toggle & Transform Chain */}
          <div className={styles.proModeSection}>
            <label className={styles.proModeToggle}>
              <input
                type="checkbox"
                checked={proMode}
                onChange={(e) => setProMode(e.target.checked)}
                className={styles.proModeCheckbox}
              />
              <span className={styles.proModeSlider}></span>
              <span className={styles.proModeLabel}>Pro Mode</span>
            </label>
            <span className={styles.proModeHint}>Show transform chain details</span>
          </div>

          {proMode && transformChain.length > 0 && (
            <div className={styles.transformChain}>
              <h4 className={styles.transformTitle}>Transform Chain</h4>
              <ul className={styles.transformList}>
                {transformChain.map((step, idx) => (
                  <li key={idx} className={`${styles.transformStep} ${styles[step.status]}`}>
                    <span className={styles.transformIndex}>{idx + 1}</span>
                    <span className={styles.transformName}>{step.name}</span>
                    <span className={styles.transformDuration}>{step.duration_ms}ms</span>
                    <span className={styles.transformStatus}>
                      {step.status === 'success' ? '✓' : step.status === 'skipped' ? '○' : '✕'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.transformTotal}>
                Total: {transformChain.reduce((sum, s) => sum + s.duration_ms, 0)}ms
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
