import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CockpitCard from '../components/CockpitCard';
import PublishReadinessCard from '../components/PublishReadinessCard';
import ComplianceRiskCard from '../components/ComplianceRiskCard';
import SLOHealthCard from '../components/SLOHealthCard';
import TopViolationsCard from '../components/TopViolationsCard';
import type { PublishReadiness, ComplianceRisk, SLOHealth, TopViolations } from '../types';

describe('CockpitCard', () => {
  it('renders title and icon', () => {
    render(
      <CockpitCard
        title="Test Card"
        icon="✓"
        primaryMetric={{ value: 'Ready', label: 'Status', status: 'success' }}
        drivers={[]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Card')).toHaveTextContent('✓');
  });

  it('renders primary metric with correct status styling', () => {
    const { rerender } = render(
      <CockpitCard
        title="Test Card"
        icon="✓"
        primaryMetric={{ value: 'Ready', label: 'Status', status: 'success' }}
        drivers={[]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    const valueElement = screen.getByText('Ready');
    expect(valueElement).toHaveClass('badge-ok');
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Test warning status
    rerender(
      <CockpitCard
        title="Test Card"
        icon="⚠"
        primaryMetric={{ value: 'Warning', label: 'Status', status: 'warning' }}
        drivers={[]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    expect(screen.getByText('Warning')).toHaveClass('badge-warn');

    // Test danger status
    rerender(
      <CockpitCard
        title="Test Card"
        icon="✕"
        primaryMetric={{ value: 'Danger', label: 'Status', status: 'danger' }}
        drivers={[]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    expect(screen.getByText('Danger')).toHaveClass('badge-danger');
  });

  it('renders driver chips with correct styling', () => {
    render(
      <CockpitCard
        title="Test Card"
        icon="✓"
        primaryMetric={{ value: 'Ready', label: 'Status', status: 'success' }}
        drivers={[
          { label: 'Items flagged', value: '3', type: 'warning' },
          { label: 'Violations', value: '2', type: 'danger' },
          { label: 'Passed', value: '10', type: 'success' }
        ]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    expect(screen.getByText(/Items flagged: 3/)).toHaveClass('badge-warn');
    expect(screen.getByText(/Violations: 2/)).toHaveClass('badge-danger');
    expect(screen.getByText(/Passed: 10/)).toHaveClass('badge-ok');
  });

  it('integrates Sparkline component', () => {
    render(
      <CockpitCard
        title="Test Card"
        icon="✓"
        primaryMetric={{ value: 'Ready', label: 'Status', status: 'success' }}
        drivers={[]}
        sparklineData={[10, 20, 15, 25, 30, 28, 35]}
        sparklineLabel="7-day trend"
      />
    );

    // Sparkline should render an SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', '7-day trend');
  });

  it('renders empty drivers list', () => {
    render(
      <CockpitCard
        title="Test Card"
        icon="✓"
        primaryMetric={{ value: 'Ready', label: 'Status', status: 'success' }}
        drivers={[]}
        sparklineData={[1, 2, 3, 4, 5, 6, 7]}
        sparklineLabel="Test trend"
      />
    );

    const driversContainer = document.querySelector('.cockpit-drivers');
    expect(driversContainer).toBeInTheDocument();
    expect(driversContainer?.children.length).toBe(0);
  });
});

describe('PublishReadinessCard', () => {
  it('renders ready status correctly', () => {
    const data: PublishReadiness = {
      status: 'ready',
      drivers: [
        { label: 'All checks passed', count: 0, type: 'success' }
      ]
    };

    render(<PublishReadinessCard data={data} sparklineData={[1, 2, 3, 4, 5, 6, 7]} />);

    expect(screen.getByText('Publish Readiness')).toBeInTheDocument();
    expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Publish Readiness')).toHaveTextContent('✓');
  });

  it('renders needs_review status correctly', () => {
    const data: PublishReadiness = {
      status: 'needs_review',
      drivers: [
        { label: 'Items need review', count: 3, type: 'warning' },
        { label: 'Policy violations', count: 2, type: 'danger' }
      ]
    };

    render(<PublishReadinessCard data={data} sparklineData={[5, 4, 6, 3, 2, 3, 3]} />);

    expect(screen.getByText('Needs Review')).toBeInTheDocument();
    expect(screen.getByLabelText('Publish Readiness')).toHaveTextContent('⚠');
    expect(screen.getByText(/Items need review: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Policy violations: 2/)).toBeInTheDocument();
  });

  it('renders block status correctly', () => {
    const data: PublishReadiness = {
      status: 'block',
      drivers: [
        { label: 'Critical violations', count: 5, type: 'danger' },
        { label: 'Recall matches', count: 1, type: 'danger' }
      ]
    };

    render(<PublishReadinessCard data={data} sparklineData={[8, 7, 9, 6, 5, 5, 5]} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByLabelText('Publish Readiness')).toHaveTextContent('✕');
    expect(screen.getByText(/Critical violations: 5/)).toBeInTheDocument();
  });

  it('displays sparkline with correct label', () => {
    const data: PublishReadiness = {
      status: 'ready',
      drivers: []
    };

    render(<PublishReadinessCard data={data} sparklineData={[1, 2, 3, 4, 5, 6, 7]} />);

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', '7-day trend of blocked items');
  });
});

describe('ComplianceRiskCard', () => {
  it('renders low risk correctly', () => {
    const data: ComplianceRisk = {
      level: 'low',
      score: 25,
      drivers: [
        { type: 'Banned claims', count: 2 },
        { type: 'Allergen risks', count: 1 }
      ]
    };

    render(<ComplianceRiskCard data={data} sparklineData={[30, 28, 25, 27, 26, 24, 25]} />);

    expect(screen.getByText('Compliance Risk')).toBeInTheDocument();
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('Score: 25/100')).toBeInTheDocument();
    expect(screen.getByLabelText('Compliance Risk')).toHaveTextContent('🛡️');
  });

  it('renders medium risk correctly', () => {
    const data: ComplianceRisk = {
      level: 'medium',
      score: 55,
      drivers: [
        { type: 'Banned claims', count: 8 },
        { type: 'Missing disclaimers', count: 5 }
      ]
    };

    render(<ComplianceRiskCard data={data} sparklineData={[50, 52, 55, 54, 56, 55, 55]} />);

    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText('Score: 55/100')).toBeInTheDocument();
    expect(screen.getByText(/Banned claims: 8/)).toHaveClass('badge-warn');
  });

  it('renders high risk correctly', () => {
    const data: ComplianceRisk = {
      level: 'high',
      score: 85,
      drivers: [
        { type: 'Banned claims', count: 15 },
        { type: 'Allergen risks', count: 12 },
        { type: 'Recalls', count: 3 }
      ]
    };

    render(<ComplianceRiskCard data={data} sparklineData={[80, 82, 85, 87, 85, 84, 85]} />);

    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('Score: 85/100')).toBeInTheDocument();
    expect(screen.getByText(/Banned claims: 15/)).toHaveClass('badge-danger');
  });

  it('applies correct driver type based on count', () => {
    const data: ComplianceRisk = {
      level: 'medium',
      score: 50,
      drivers: [
        { type: 'Low count', count: 3 },
        { type: 'Medium count', count: 7 },
        { type: 'High count', count: 12 }
      ]
    };

    render(<ComplianceRiskCard data={data} sparklineData={[50, 50, 50, 50, 50, 50, 50]} />);

    expect(screen.getByText(/Low count: 3/)).toHaveClass('badge-ok');
    expect(screen.getByText(/Medium count: 7/)).toHaveClass('badge-warn');
    expect(screen.getByText(/High count: 12/)).toHaveClass('badge-danger');
  });
});

describe('SLOHealthCard', () => {
  it('renders healthy SLO status', () => {
    const data: SLOHealth = {
      p95_latency_ms: 150,
      latency_budget_ms: 300,
      error_rate: 0.001,
      circuit_breaker_state: 'closed'
    };

    render(<SLOHealthCard data={data} sparklineData={[140, 145, 150, 148, 152, 150, 150]} />);

    expect(screen.getByText('SLO Health')).toBeInTheDocument();
    expect(screen.getByText('150ms / 300ms')).toBeInTheDocument();
    expect(screen.getByText('p95 Latency vs Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('SLO Health')).toHaveTextContent('⚡');
  });

  it('renders warning status when latency is high', () => {
    const data: SLOHealth = {
      p95_latency_ms: 240,
      latency_budget_ms: 300,
      error_rate: 0.002,
      circuit_breaker_state: 'closed'
    };

    render(<SLOHealthCard data={data} sparklineData={[220, 230, 240, 235, 245, 240, 240]} />);

    expect(screen.getByText('240ms / 300ms')).toHaveClass('badge-warn');
  });

  it('renders danger status when latency exceeds budget', () => {
    const data: SLOHealth = {
      p95_latency_ms: 280,
      latency_budget_ms: 300,
      error_rate: 0.015,
      circuit_breaker_state: 'open'
    };

    render(<SLOHealthCard data={data} sparklineData={[270, 275, 280, 285, 280, 278, 280]} />);

    expect(screen.getByText('280ms / 300ms')).toHaveClass('badge-danger');
  });

  it('displays error rate with correct formatting and status', () => {
    const data: SLOHealth = {
      p95_latency_ms: 150,
      latency_budget_ms: 300,
      error_rate: 0.002,
      circuit_breaker_state: 'closed'
    };

    render(<SLOHealthCard data={data} sparklineData={[150, 150, 150, 150, 150, 150, 150]} />);

    expect(screen.getByText(/Error Rate: 0\.20%/)).toBeInTheDocument();
    expect(screen.getByText(/Error Rate: 0\.20%/)).toHaveClass('badge-ok');
  });

  it('displays circuit breaker states correctly', () => {
    const closedData: SLOHealth = {
      p95_latency_ms: 150,
      latency_budget_ms: 300,
      error_rate: 0.001,
      circuit_breaker_state: 'closed'
    };

    const { rerender } = render(
      <SLOHealthCard data={closedData} sparklineData={[150, 150, 150, 150, 150, 150, 150]} />
    );

    expect(screen.getByText(/Circuit Breaker: Closed/)).toHaveClass('badge-ok');

    // Test half-open state
    const halfOpenData: SLOHealth = {
      ...closedData,
      circuit_breaker_state: 'half_open'
    };

    rerender(<SLOHealthCard data={halfOpenData} sparklineData={[150, 150, 150, 150, 150, 150, 150]} />);
    expect(screen.getByText(/Circuit Breaker: Half-Open/)).toHaveClass('badge-warn');

    // Test open state
    const openData: SLOHealth = {
      ...closedData,
      circuit_breaker_state: 'open'
    };

    rerender(<SLOHealthCard data={openData} sparklineData={[150, 150, 150, 150, 150, 150, 150]} />);
    expect(screen.getByText(/Circuit Breaker: Open/)).toHaveClass('badge-danger');
  });
});

describe('TopViolationsCard', () => {
  it('renders with all violation types', () => {
    const data: TopViolations = {
      banned_claims: 15,
      allergens: 8,
      recalls: 2,
      pii: 1
    };

    render(<TopViolationsCard data={data} sparklineData={[30, 28, 26, 25, 27, 26, 26]} />);

    expect(screen.getByText('Top Violations Today')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument(); // Total
    expect(screen.getByText('Total Violations')).toBeInTheDocument();
    expect(screen.getByLabelText('Top Violations Today')).toHaveTextContent('🚨');
  });

  it('displays all non-zero violation types as drivers', () => {
    const data: TopViolations = {
      banned_claims: 15,
      allergens: 8,
      recalls: 2,
      pii: 1
    };

    render(<TopViolationsCard data={data} sparklineData={[26, 26, 26, 26, 26, 26, 26]} />);

    expect(screen.getByText(/Banned Claims: 15/)).toBeInTheDocument();
    expect(screen.getByText(/Allergens: 8/)).toBeInTheDocument();
    expect(screen.getByText(/Recalls: 2/)).toBeInTheDocument();
    expect(screen.getByText(/PII: 1/)).toBeInTheDocument();
  });

  it('filters out zero-count violations', () => {
    const data: TopViolations = {
      banned_claims: 10,
      allergens: 0,
      recalls: 0,
      pii: 0
    };

    render(<TopViolationsCard data={data} sparklineData={[10, 10, 10, 10, 10, 10, 10]} />);

    expect(screen.getByText(/Banned Claims: 10/)).toBeInTheDocument();
    expect(screen.queryByText(/Allergens:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recalls:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PII:/)).not.toBeInTheDocument();
  });

  it('applies correct status based on total violations', () => {
    // Low violations (success)
    const lowData: TopViolations = {
      banned_claims: 3,
      allergens: 2,
      recalls: 0,
      pii: 0
    };

    const { rerender } = render(
      <TopViolationsCard data={lowData} sparklineData={[5, 5, 5, 5, 5, 5, 5]} />
    );

    expect(screen.getByText('5')).toHaveClass('badge-ok');

    // Medium violations (warning)
    const mediumData: TopViolations = {
      banned_claims: 8,
      allergens: 5,
      recalls: 2,
      pii: 0
    };

    rerender(<TopViolationsCard data={mediumData} sparklineData={[15, 15, 15, 15, 15, 15, 15]} />);
    expect(screen.getByText('15')).toHaveClass('badge-warn');

    // High violations (danger)
    const highData: TopViolations = {
      banned_claims: 15,
      allergens: 8,
      recalls: 3,
      pii: 2
    };

    rerender(<TopViolationsCard data={highData} sparklineData={[28, 28, 28, 28, 28, 28, 28]} />);
    expect(screen.getByText('28')).toHaveClass('badge-danger');
  });

  it('applies correct driver type based on individual counts', () => {
    const data: TopViolations = {
      banned_claims: 3,
      allergens: 7,
      recalls: 12,
      pii: 0
    };

    render(<TopViolationsCard data={data} sparklineData={[22, 22, 22, 22, 22, 22, 22]} />);

    expect(screen.getByText(/Banned Claims: 3/)).toHaveClass('badge-ok');
    expect(screen.getByText(/Allergens: 7/)).toHaveClass('badge-warn');
    expect(screen.getByText(/Recalls: 12/)).toHaveClass('badge-danger');
  });
});
