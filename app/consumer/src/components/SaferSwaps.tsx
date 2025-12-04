import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateSuggestions,
  trackSuggestionClick,
  type SaferSwapSuggestion,
} from '../lib/safer-swaps';
import { getVerdict } from '../lib/trust-score';
import { useAllergenProfile } from '../hooks/useAllergenProfile';
import { VerdictBadge } from './VerdictBadge';
import styles from './SaferSwaps.module.css';

interface SaferSwapsProps {
  currentScore: number;
  category?: string;
}

interface PersonalizationPreferences {
  respectAllergens: boolean;
  vegetarian: boolean;
  vegan: boolean;
  noAddedSugar: boolean;
}

export function SaferSwaps({ currentScore, category }: SaferSwapsProps) {
  const navigate = useNavigate();
  const { getAllAllergens } = useAllergenProfile();
  
  const [preferences, setPreferences] = useState<PersonalizationPreferences>({
    respectAllergens: true,
    vegetarian: false,
    vegan: false,
    noAddedSugar: false,
  });

  const suggestions = generateSuggestions(currentScore, category);

  const handleViewDetails = (suggestion: SaferSwapSuggestion) => {
    // Track click for analytics
    trackSuggestionClick(suggestion.id);

    // Navigate to results page with mock data for the suggestion
    // In a real implementation, this would fetch actual product data
    const mockResult = {
      trust_score: suggestion.trustScore,
      verdict: getVerdict(suggestion.trustScore),
      badges: [],
      reasons: [],
    };

    const encodedData = btoa(JSON.stringify(mockResult));
    navigate(`/results?data=${encodedData}`);
  };

  if (suggestions.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Safer Swaps</h2>
        <div className={styles.noSuggestions}>
          <div className={styles.noSuggestionsIcon}>✨</div>
          <p className={styles.noSuggestionsText}>
            Great choice! This product already has a high trust score. No
            alternatives needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Safer Swaps</h2>
        <p className={styles.description}>
          Consider these alternatives with better trust scores
        </p>
      </div>

      <div className={styles.personalization}>
        <h3 className={styles.personalizationTitle}>Personalize suggestions</h3>
        <div className={styles.toggles}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.respectAllergens}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  respectAllergens: e.target.checked,
                }))
              }
              className={styles.toggleInput}
            />
            <span className={styles.toggleLabel}>
              Respect my allergens
              {preferences.respectAllergens && getAllAllergens().length > 0 && (
                <span className={styles.toggleBadge}>
                  {getAllAllergens().length}
                </span>
              )}
            </span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.vegetarian}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  vegetarian: e.target.checked,
                  vegan: e.target.checked ? false : prev.vegan,
                }))
              }
              className={styles.toggleInput}
            />
            <span className={styles.toggleLabel}>Vegetarian</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.vegan}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  vegan: e.target.checked,
                  vegetarian: e.target.checked ? false : prev.vegetarian,
                }))
              }
              className={styles.toggleInput}
            />
            <span className={styles.toggleLabel}>Vegan</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.noAddedSugar}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  noAddedSugar: e.target.checked,
                }))
              }
              className={styles.toggleInput}
            />
            <span className={styles.toggleLabel}>No added sugar</span>
          </label>
        </div>
      </div>

      <div className={styles.list}>
        {suggestions.map((suggestion) => {
          const verdict = getVerdict(suggestion.trustScore);
          const scoreDiff = suggestion.trustScore - currentScore;

          return (
            <div key={suggestion.id} className={styles.suggestion}>
              {suggestion.thumbnail && (
                <div className={styles.thumbnail}>
                  <img
                    src={suggestion.thumbnail}
                    alt=""
                    className={styles.thumbnailImage}
                  />
                </div>
              )}

              <div className={styles.content}>
                <div className={styles.header}>
                  <h3 className={styles.name}>{suggestion.name}</h3>
                  <VerdictBadge verdict={verdict} compact />
                </div>

                <div className={styles.score}>
                  <span className={styles.scoreLabel}>Trust Score:</span>
                  <span className={styles.scoreValue}>
                    {suggestion.trustScore}
                  </span>
                  <span className={styles.scoreDiff}>
                    (+{scoreDiff} points)
                  </span>
                </div>

                <div className={styles.scoreExplanation}>
                  <span className={styles.scoreExplanationLabel}>
                    What changed the score:
                  </span>
                  <p className={styles.scoreExplanationText}>
                    {scoreDiff >= 30
                      ? 'Significantly fewer policy violations and cleaner ingredient list'
                      : scoreDiff >= 20
                      ? 'Fewer flagged claims and better compliance'
                      : 'Minor improvements in policy compliance'}
                  </p>
                </div>

                <div className={styles.differences}>
                  <span className={styles.differencesLabel}>
                    Key differences:
                  </span>
                  <ul className={styles.differencesList}>
                    {suggestion.keyDifferences.map((diff, index) => (
                      <li key={index} className={styles.differenceItem}>
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={styles.viewButton}
                  onClick={() => handleViewDetails(suggestion)}
                  aria-label={`View details for ${suggestion.name}`}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.disclaimer}>
        <span className={styles.disclaimerIcon}>⚠️</span>
        <span className={styles.disclaimerText}>
          Suggestions may not match all preferences… Always check labels.
        </span>
      </div>
    </div>
  );
}
