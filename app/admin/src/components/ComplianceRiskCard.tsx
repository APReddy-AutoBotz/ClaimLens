import CockpitCard from './CockpitCard';
import type { ComplianceRisk } from '../types';
import { formatRiskLevel, formatScore, formatCount } from '../utils/formatters';

interface ComplianceRiskCardProps {
  data: ComplianceRisk;
  sparklineData: number[];
}

function ComplianceRiskCard({ data, sparklineData }: ComplianceRiskCardProps) {
  const levelConfig = {
    low: {
      label: 'Low Risk',
      status: 'success' as const
    },
    medium: {
      label: 'Medium Risk',
      status: 'warning' as const
    },
    high: {
      label: 'High Risk',
      status: 'danger' as const
    }
  };

  // Use safe formatting for risk level
  const riskLabel = formatRiskLevel(data.level, data.score);
  const scoreLabel = `Score: ${formatScore(data.score)}`;
  
  // Determine status based on level, with fallback
  let status: 'success' | 'warning' | 'danger' = 'warning';
  if (data.level && levelConfig[data.level]) {
    status = levelConfig[data.level].status;
  } else if (data.score != null && !isNaN(data.score)) {
    // Fallback: determine status from score
    if (data.score < 30) {
      status = 'success';
    } else if (data.score < 70) {
      status = 'warning';
    } else {
      status = 'danger';
    }
  }

  return (
    <CockpitCard
      title="Compliance Risk"
      icon="🛡️"
      primaryMetric={{
        value: riskLabel,
        label: scoreLabel,
        status
      }}
      drivers={(data.drivers || []).map(driver => {
        // Determine driver type based on count
        let driverType: 'success' | 'warning' | 'danger' = 'success';
        const count = driver.count ?? 0;
        if (count > 10) {
          driverType = 'danger';
        } else if (count > 5) {
          driverType = 'warning';
        }

        return {
          label: driver.type || 'Unknown',
          value: formatCount(driver.count),
          type: driverType
        };
      })}
      sparklineData={sparklineData}
      sparklineLabel="7-day trend of compliance risk score"
    />
  );
}

export default ComplianceRiskCard;
