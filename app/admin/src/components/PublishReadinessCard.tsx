import CockpitCard from './CockpitCard';
import type { PublishReadiness } from '../types';
import { formatCount } from '../utils/formatters';

interface PublishReadinessCardProps {
  data: PublishReadiness;
  sparklineData: number[];
}

function PublishReadinessCard({ data, sparklineData }: PublishReadinessCardProps) {
  const statusConfig = {
    ready: {
      icon: '✓',
      label: 'Ready to Publish',
      status: 'success' as const
    },
    needs_review: {
      icon: '⚠',
      label: 'Needs Review',
      status: 'warning' as const
    },
    block: {
      icon: '✕',
      label: 'Blocked',
      status: 'danger' as const
    }
  };

  const config = statusConfig[data.status] || {
    icon: '?',
    label: 'Unknown Status',
    status: 'warning' as const
  };

  return (
    <CockpitCard
      title="Publish Readiness"
      icon={config.icon}
      primaryMetric={{
        value: config.label,
        label: 'Status',
        status: config.status
      }}
      drivers={(data.drivers || []).map(driver => ({
        label: driver.label || 'Unknown',
        value: formatCount(driver.count),
        type: driver.type || 'warning'
      }))}
      sparklineData={sparklineData}
      sparklineLabel="7-day trend of blocked items"
    />
  );
}

export default PublishReadinessCard;
