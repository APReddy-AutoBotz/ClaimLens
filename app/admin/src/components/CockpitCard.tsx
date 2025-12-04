import Sparkline from './Sparkline';

export interface CockpitCardProps {
  title: string;
  icon: string;
  primaryMetric: {
    value: string | number;
    label: string;
    status: 'success' | 'warning' | 'danger';
  };
  drivers: Array<{
    label: string;
    value: string;
    type: 'success' | 'warning' | 'danger';
  }>;
  sparklineData: number[];
  sparklineLabel: string;
}

function CockpitCard({
  title,
  icon,
  primaryMetric,
  drivers,
  sparklineData,
  sparklineLabel
}: CockpitCardProps) {
  const statusColors = {
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171'
  };

  const statusClasses = {
    success: 'badge-ok',
    warning: 'badge-warn',
    danger: 'badge-danger'
  };

  const statusValueClasses = {
    success: 'status-ready',
    warning: 'status-warning',
    danger: 'status-danger'
  };

  // Map status to data attribute for CSS styling
  const dataStatus = primaryMetric.status === 'success' ? 'ready' : 
                     primaryMetric.status === 'warning' ? 'warning' : 'danger';

  return (
    <div className="cockpit-card hover-lift" data-status={dataStatus}>
      <div className="cockpit-card-header">
        <span 
          className="cockpit-icon" 
          role="img" 
          aria-label={title}
          style={{ 
            filter: `drop-shadow(0 0 8px ${statusColors[primaryMetric.status]}40)` 
          }}
        >
          {icon}
        </span>
        <h3 className="cockpit-title">{title}</h3>
      </div>

      <div className="cockpit-metric">
        <div className={`cockpit-value ${statusValueClasses[primaryMetric.status]} ${statusClasses[primaryMetric.status]}`}>
          {primaryMetric.value}
        </div>
        <div className="cockpit-label">{primaryMetric.label}</div>
      </div>

      <div className="cockpit-drivers">
        {drivers.length > 0 && drivers.map((driver, index) => (
          <span 
            key={index} 
            className={`driver-chip cl-badge ${statusClasses[driver.type]}`}
          >
            {driver.label}: {driver.value}
          </span>
        ))}
      </div>

      <div className="cockpit-sparkline">
        <Sparkline 
          data={sparklineData}
          width={140}
          height={36}
          color={statusColors[primaryMetric.status]}
          ariaLabel={sparklineLabel}
        />
      </div>
    </div>
  );
}

export default CockpitCard;
