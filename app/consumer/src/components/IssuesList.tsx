import { useState } from 'react';
import { AllergenAlertBanner } from './AllergenAlertBanner';
import styles from './IssuesList.module.css';

export interface Issue {
  kind: 'warn' | 'danger' | 'ok';
  label: string;
  explanation: string;
  source?: string;
  isUserAllergen?: boolean;
  category?: 'banned_claims' | 'allergens' | 'missing_disclaimers' | 'weasel_words' | 'recall_signals' | 'other';
  severity?: 'low' | 'medium' | 'high';
  matchedText?: string;
}

interface IssuesListProps {
  issues: Issue[];
  userAllergens?: string[];
}

type IssueCategory = 'banned_claims' | 'allergens' | 'missing_disclaimers' | 'weasel_words' | 'recall_signals' | 'other';

interface GroupedIssues {
  banned_claims: Issue[];
  allergens: Issue[];
  missing_disclaimers: Issue[];
  weasel_words: Issue[];
  recall_signals: Issue[];
  other: Issue[];
}

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: string; description: string }> = {
  banned_claims: {
    label: 'Banned Claims',
    icon: '🚫',
    description: 'Claims that violate policy regulations',
  },
  allergens: {
    label: 'Allergens',
    icon: '⚠️',
    description: 'Allergen-related warnings',
  },
  missing_disclaimers: {
    label: 'Missing Disclaimers',
    icon: '📋',
    description: 'Required disclaimers not found',
  },
  weasel_words: {
    label: 'Weasel Words',
    icon: '🔍',
    description: 'Vague or misleading language detected',
  },
  recall_signals: {
    label: 'Recall Signals',
    icon: '🔔',
    description: 'Potential recall indicators',
  },
  other: {
    label: 'Other Issues',
    icon: '📌',
    description: 'Additional findings',
  },
};

export function IssuesList({ issues, userAllergens = [] }: IssuesListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<IssueCategory>>(
    new Set(['banned_claims', 'allergens', 'missing_disclaimers', 'weasel_words', 'recall_signals'])
  );

  if (issues.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>✓</span>
        <p className={styles.emptyText}>No issues detected</p>
      </div>
    );
  }

  // Check if an issue is related to user allergens
  const isUserAllergenIssue = (issue: Issue): boolean => {
    if (userAllergens.length === 0) return false;
    const lowerLabel = issue.label.toLowerCase();
    const lowerExplanation = issue.explanation.toLowerCase();
    return userAllergens.some(allergen => 
      lowerLabel.includes(allergen.toLowerCase()) || 
      lowerExplanation.includes(allergen.toLowerCase())
    );
  };

  // Categorize issues automatically if not already categorized
  const categorizeIssue = (issue: Issue): IssueCategory => {
    if (issue.category) return issue.category;
    
    const lowerLabel = issue.label.toLowerCase();
    const lowerExplanation = issue.explanation.toLowerCase();
    
    // Allergen detection
    if (lowerLabel.includes('allergen') || lowerExplanation.includes('allergen') || 
        lowerLabel.includes('contains') || isUserAllergenIssue(issue)) {
      return 'allergens';
    }
    
    // Banned claims detection
    if (lowerLabel.includes('banned') || lowerLabel.includes('prohibited') || 
        lowerLabel.includes('claim') || lowerExplanation.includes('policy violation')) {
      return 'banned_claims';
    }
    
    // Missing disclaimers detection
    if (lowerLabel.includes('disclaimer') || lowerLabel.includes('missing') || 
        lowerExplanation.includes('required statement')) {
      return 'missing_disclaimers';
    }
    
    // Weasel words detection
    if (lowerLabel.includes('weasel') || lowerLabel.includes('vague') || 
        lowerExplanation.includes('misleading language')) {
      return 'weasel_words';
    }
    
    // Recall signals detection
    if (lowerLabel.includes('recall') || lowerExplanation.includes('recall')) {
      return 'recall_signals';
    }
    
    return 'other';
  };

  // Group issues by category
  const groupedIssues: GroupedIssues = issues.reduce((acc, issue) => {
    const category = categorizeIssue(issue);
    acc[category].push(issue);
    return acc;
  }, {
    banned_claims: [],
    allergens: [],
    missing_disclaimers: [],
    weasel_words: [],
    recall_signals: [],
    other: [],
  } as GroupedIssues);

  // Filter out empty groups
  const nonEmptyGroups = (Object.keys(groupedIssues) as IssueCategory[]).filter(
    category => groupedIssues[category].length > 0
  );

  const toggleGroup = (category: IssueCategory) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const renderIssue = (issue: Issue, index: number) => {
    const isUserAllergen = issue.isUserAllergen || isUserAllergenIssue(issue);
    const severity = issue.severity || (issue.kind === 'danger' ? 'high' : issue.kind === 'warn' ? 'medium' : 'low');
    
    return (
      <li 
        key={index} 
        className={`${styles.item} ${styles[issue.kind]} ${isUserAllergen ? styles.userAllergen : ''}`}
      >
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            {issue.kind === 'danger' ? '✕' : issue.kind === 'warn' ? '⚠' : '✓'}
          </span>
          <div className={styles.labelContainer}>
            <span className={styles.label}>
              {issue.label}
              {isUserAllergen && (
                <span className={styles.allergenBadge} aria-label="From your allergen profile">
                  🛡️
                </span>
              )}
            </span>
            <span className={`${styles.severityBadge} ${styles[`severity-${severity}`]}`}>
              {severity}
            </span>
          </div>
        </div>
        <p className={styles.explanation}>{issue.explanation}</p>
        {issue.matchedText && (
          <div className={styles.matchedText}>
            <span className={styles.matchedTextLabel}>Matched text:</span>
            <code className={styles.matchedTextContent}>{issue.matchedText}</code>
          </div>
        )}
        {issue.source && (
          <a 
            href={issue.source} 
            className={styles.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source →
          </a>
        )}
      </li>
    );
  };

  // Detect user allergens in issues
  const detectedUserAllergens = issues
    .filter(issue => isUserAllergenIssue(issue) || issue.isUserAllergen)
    .flatMap(issue => {
      // Extract allergen names from the issue
      const matches = userAllergens.filter(allergen => 
        issue.label.toLowerCase().includes(allergen.toLowerCase()) ||
        issue.explanation.toLowerCase().includes(allergen.toLowerCase())
      );
      return matches;
    })
    .filter((allergen, index, self) => self.indexOf(allergen) === index); // Remove duplicates

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Detected Issues</h2>
      
      {/* Allergen Alert Banner */}
      {detectedUserAllergens.length > 0 && (
        <AllergenAlertBanner detectedAllergens={detectedUserAllergens} />
      )}
      
      <div className={styles.groupsContainer}>
        {nonEmptyGroups.map(category => {
          const config = CATEGORY_CONFIG[category];
          const categoryIssues = groupedIssues[category];
          const isExpanded = expandedGroups.has(category);
          const count = categoryIssues.length;

          return (
            <div key={category} className={styles.group}>
              <button
                className={styles.groupHeader}
                onClick={() => toggleGroup(category)}
                aria-expanded={isExpanded}
                aria-controls={`group-${category}`}
              >
                <span className={styles.groupIcon}>{config.icon}</span>
                <div className={styles.groupInfo}>
                  <span className={styles.groupLabel}>{config.label}</span>
                  <span className={styles.groupDescription}>{config.description}</span>
                </div>
                <span className={styles.groupCount}>{count}</span>
                <span className={styles.groupToggle} aria-hidden="true">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              {isExpanded && (
                <ul 
                  id={`group-${category}`}
                  className={styles.list} 
                  role="list"
                >
                  {categoryIssues.map((issue, index) => renderIssue(issue, index))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
