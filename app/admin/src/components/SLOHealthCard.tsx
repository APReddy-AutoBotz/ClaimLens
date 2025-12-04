import CockpitCard from './CockpitCard';
import type { SLOHealth } from '../types';
import { formatLatencyComparison, formatPercent } from '../utils/formatters';

interface SLOHealthCardProps {
  data: SLOHealth;
  sparklineData: number[];
}

function SLOHealthCard({ data, sparklineData }: SLOHealthCardProps) {
  // Determine status based on latency vs budget
  let status: 'success' | 'warning' | 'danger' = 'success';
  
  if (data.p95_latency_ms != null && data.latency_budget_ms != null) {
    const latencyRatio = data.p95_latency_ms / data.latency_budget_ms;
    if (latencyRatio > 0.9) {
      status = 'danger';
    } else if (latencyRatio > 0.75) {
      status = 'warning';
    }
  }

  // Format error rate as percentage with safe fallback
  const errorRatePercent = formatPercent(data.error_rate);

  // Circuit breaker status
  const circuitBreakerConfig = {
    closed: { label: 'Closed', type: 'success' as const },
    open: { label: 'Open', type: 'danger' as const },
    half_open: { label: 'Half-Open', type: 'warning' as const }
  };

  const cbConfig = circuitBreakerConfig[data.circuit_breaker_state] || {
    label: 'Unknown',
    type: 'warning' as const
  };

  // Determine error rate status
  let errorRateType: 'success' | 'warning' | 'danger' = 'success';
  if (data.error_rate != null && !isNaN(data.error_rate)) {
    if (data.error_rate > 0.01) {
      errorRateType = 'danger';
    } else if (data.error_rate > 0.005) {
      errorRateType = 'warning';
    }
  }

  return (
    <CockpitCard
      title="SLO Health"
      icon="⚡"
      primaryMetric={{
        value: formatLatencyComparison(data.p95_latency_ms, data.latency_budget_ms),
        label: 'p95 Latency vs Budget',
        status
      }}
      drivers={[
        {
          label: 'Error Rate',
          value: errorRatePercent,
          type: errorRateType
        },
        {
          label: 'Circuit Breaker',
          value: cbConfig.label,
          type: cbConfig.type
        }
      ]}
      sparklineData={sparklineData}
      sparklineLabel="7-day trend of p95 latency"
    />
  );
}

export default SLOHealthCard;
