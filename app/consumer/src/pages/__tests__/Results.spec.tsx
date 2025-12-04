import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Results from '../Results';

describe('Results Page', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render empty state when no results', () => {
    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText(/No scan results found/i)).toBeInTheDocument();
  });

  it('should render results when data is in sessionStorage', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        brand: 'Test Brand',
        category: 'Test Category',
        sourceType: 'text' as const,
        sourceLabel: 'test',
      },
      trust_score: 85,
      verdict: {
        label: 'allow',
        color: '#10B981',
        icon: '✓',
        explanation: 'This product meets safety standards with minimal concerns.',
      },
      badges: [],
      reasons: [],
      breakdown: {
        baseScore: 90,
        bannedClaimsDeduction: 0,
        recallDeduction: 0,
        allergenDeduction: 0,
        weaselWordDeduction: 0,
        cleanBonus: 10,
        finalScore: 85,
      },
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/allow/i)).toBeInTheDocument();
  });

  it('should render issues list when issues present', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        sourceType: 'text' as const,
      },
      trust_score: 60,
      verdict: {
        label: 'caution',
        color: '#F59E0B',
        icon: '⚠',
        explanation: 'This product has some concerns.',
      },
      badges: [
        {
          kind: 'warn' as const,
          label: 'Allergen Warning',
          explanation: 'Contains peanuts',
        },
      ],
      reasons: [],
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    expect(screen.getByText('Allergen Warning')).toBeInTheDocument();
    expect(screen.getByText('Contains peanuts')).toBeInTheDocument();
  });

  it('should clamp trust score to 100 maximum', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        sourceType: 'text' as const,
      },
      trust_score: 150, // Over 100
      verdict: {
        label: 'allow',
        color: '#10B981',
        icon: '✓',
        explanation: 'This product meets safety standards.',
      },
      badges: [],
      reasons: [],
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    // Should display 100, not 150
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('should clamp trust score to 0 minimum', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        sourceType: 'text' as const,
      },
      trust_score: -20, // Below 0
      verdict: {
        label: 'avoid',
        color: '#EF4444',
        icon: '✕',
        explanation: 'This product has significant concerns.',
      },
      badges: [],
      reasons: [],
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    // Should display 0, not -20 - check for the score with aria-label
    const scoreElement = screen.getByRole('status', { name: /Trust score: 0 out of 100/i });
    expect(scoreElement).toBeInTheDocument();
  });

  it('should render receipts drawer', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        sourceType: 'text' as const,
      },
      trust_score: 75,
      verdict: {
        label: 'caution',
        color: '#F59E0B',
        icon: '⚠',
        explanation: 'This product has some concerns.',
      },
      badges: [],
      reasons: [],
      correlation_id: 'test-123',
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    expect(screen.getByText('Receipts')).toBeInTheDocument();
    expect(screen.getByText('No tricks. Just proof.')).toBeInTheDocument();
  });

  it('should show improved verdict copy for clean products', () => {
    const mockResults = {
      productIdentity: {
        name: 'Test Product',
        sourceType: 'text' as const,
      },
      trust_score: 100,
      verdict: {
        label: 'allow',
        color: '#10B981',
        icon: '✓',
        explanation: 'This product meets safety standards.',
      },
      badges: [],
      reasons: [],
    };

    sessionStorage.setItem('scanResults', JSON.stringify(mockResults));

    render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );

    expect(screen.getByText(/No policy violations found/i)).toBeInTheDocument();
    expect(screen.getByText(/Based on claim policy/i)).toBeInTheDocument();
  });
});
