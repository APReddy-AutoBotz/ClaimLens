import CockpitCard from './CockpitCard';
import type { TopViolations } from '../types';
import { formatCount } from '../utils/formatters';

interface TopViolationsCardProps {
  data: TopViolations;
  sparklineData: number[];
}

function TopViolationsCard({ data, sparklineData }: TopViolationsCardProps) {
  // Safe calculation of total violations
  const bannedClaims = data.banned_claims ?? 0;
  const allergens = data.allergens ?? 0;
  const recalls = data.recalls ?? 0;
  const pii = data.pii ?? 0;
  
  const totalViolations = bannedClaims + allergens + recalls + pii;

  // Determine status based on total violations
  let status: 'success' | 'warning' | 'danger' = 'success';
  if (totalViolations > 20) {
    status = 'danger';
  } else if (totalViolations > 10) {
    status = 'warning';
  }

  // Create drivers for each violation type
  const drivers = [
    { label: 'Banned Claims', value: bannedClaims, type: 'banned_claims' },
    { label: 'Allergens', value: allergens, type: 'allergens' },
    { label: 'Recalls', value: recalls, type: 'recalls' },
    { label: 'PII', value: pii, type: 'pii' }
  ]
    .filter(d => d.value > 0) // Only show non-zero violations
    .map(d => {
      // Determine driver type based on count
      let driverType: 'success' | 'warning' | 'danger' = 'success';
      if (d.value > 10) {
        driverType = 'danger';
      } else if (d.value > 5) {
        driverType = 'warning';
      }

      return {
        label: d.label,
        value: formatCount(d.value),
        type: driverType
      };
    });

  return (
    <CockpitCard
      title="Top Violations Today"
      icon="🚨"
      primaryMetric={{
        value: formatCount(totalViolations),
        label: 'Total Violations',
        status
      }}
      drivers={drivers}
      sparklineData={sparklineData}
      sparklineLabel="7-day trend of total violations"
    />
  );
}

export default TopViolationsCard;
