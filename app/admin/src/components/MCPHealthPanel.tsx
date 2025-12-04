import { useEffect, useState } from 'react';
import styles from './MCPHealthPanel.module.css';

export interface MCPService {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastCheck: Date;
  circuitState: 'closed' | 'half-open' | 'open';
  fallbackStrategy: string;
}

interface MCPHealthPanelProps {
  demoMode?: boolean;
}

export function MCPHealthPanel({ demoMode = false }: MCPHealthPanelProps) {
  const [services, setServices] = useState<MCPService[]>([
    {
      name: 'OCR Label',
      port: 7001,
      status: 'healthy',
      latency: 45,
      lastCheck: new Date(),
      circuitState: 'closed',
      fallbackStrategy: 'pass-through (skip OCR, use text-only analysis)',
    },
    {
      name: 'Unit Convert',
      port: 7002,
      status: 'healthy',
      latency: 12,
      lastCheck: new Date(),
      circuitState: 'closed',
      fallbackStrategy: 'pass-through (use default per-100g assumptions)',
    },
    {
      name: 'Recall Lookup',
      port: 7003,
      status: 'healthy',
      latency: 89,
      lastCheck: new Date(),
      circuitState: 'closed',
      fallbackStrategy: 'modify (add generic safety disclaimer)',
    },
    {
      name: 'Alt Suggester',
      port: 7004,
      status: 'healthy',
      latency: 156,
      lastCheck: new Date(),
      circuitState: 'closed',
      fallbackStrategy: 'pass-through (flag without suggesting alternatives)',
    },
  ]);

  const [fallbackUsageCount, setFallbackUsageCount] = useState<Record<string, number>>({
    'OCR Label': 0,
    'Unit Convert': 0,
    'Recall Lookup': 2,
    'Alt Suggester': 1,
  });

  useEffect(() => {
    // Poll health status every 5 seconds
    const interval = setInterval(async () => {
      const updatedServices = await Promise.all(
        services.map(async (service) => {
          try {
            const start = Date.now();
            const response = await fetch(`http://localhost:${service.port}/health`, {
              signal: AbortSignal.timeout(500),
            });
            const latency = Date.now() - start;

            if (response.ok) {
              return {
                ...service,
                status: 'healthy' as const,
                latency,
                lastCheck: new Date(),
                circuitState: 'closed' as const,
              };
            } else {
              return {
                ...service,
                status: 'degraded' as const,
                lastCheck: new Date(),
                circuitState: 'half-open' as const,
              };
            }
          } catch (error) {
            return {
              ...service,
              status: 'down' as const,
              latency: undefined,
              lastCheck: new Date(),
              circuitState: 'open' as const,
            };
          }
        })
      );

      setServices(updatedServices);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSimulateOutage = (serviceName: string) => {
    if (!demoMode) return;

    setServices((prev) =>
      prev.map((s) =>
        s.name === serviceName
          ? {
              ...s,
              status: s.status === 'down' ? 'healthy' : 'down',
              circuitState: s.status === 'down' ? 'closed' : 'open',
              latency: s.status === 'down' ? 45 : undefined,
            }
          : s
      )
    );

    // Increment fallback usage count
    if (services.find((s) => s.name === serviceName)?.status !== 'down') {
      setFallbackUsageCount((prev) => ({
        ...prev,
        [serviceName]: (prev[serviceName] || 0) + 1,
      }));
    }
  };

  const getStatusColor = (status: MCPService['status']) => {
    switch (status) {
      case 'healthy':
        return 'var(--color-emerald, #10B981)';
      case 'degraded':
        return 'var(--color-amber, #F59E0B)';
      case 'down':
        return 'var(--color-red, #EF4444)';
    }
  };

  const getCircuitStateLabel = (state: MCPService['circuitState']) => {
    switch (state) {
      case 'closed':
        return 'Closed (Normal)';
      case 'half-open':
        return 'Half-Open (Testing)';
      case 'open':
        return 'Open (Failing)';
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.icon}>🔌</span>
          MCP Service Health
        </h3>
        {demoMode && (
          <span className={styles.demoBadge}>Demo Mode</span>
        )}
      </div>

      <div className={styles.services}>
        {services.map((service) => (
          <div key={service.name} className={styles.service}>
            <div className={styles.serviceHeader}>
              <div className={styles.serviceName}>
                <span
                  className={styles.statusDot}
                  style={{ backgroundColor: getStatusColor(service.status) }}
                  aria-label={`Status: ${service.status}`}
                />
                <span className={styles.name}>{service.name}</span>
                <span className={styles.port}>:{service.port}</span>
              </div>
              <div className={styles.serviceStatus}>
                <span
                  className={styles.statusPill}
                  data-status={service.status}
                >
                  {service.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className={styles.serviceDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Circuit Breaker:</span>
                <span className={styles.detailValue} data-circuit={service.circuitState}>
                  {getCircuitStateLabel(service.circuitState)}
                </span>
              </div>

              {service.latency !== undefined && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Latency:</span>
                  <span className={styles.detailValue}>{service.latency}ms</span>
                </div>
              )}

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Last Check:</span>
                <span className={styles.detailValue}>
                  {service.lastCheck.toLocaleTimeString()}
                </span>
              </div>

              {service.status !== 'healthy' && (
                <div className={styles.fallbackInfo}>
                  <span className={styles.fallbackLabel}>Fallback:</span>
                  <span className={styles.fallbackText}>{service.fallbackStrategy}</span>
                </div>
              )}

              {fallbackUsageCount[service.name] > 0 && (
                <div className={styles.usageInfo}>
                  <span className={styles.usageIcon}>📊</span>
                  <span className={styles.usageText}>
                    Fallback used in last 10 audits: {fallbackUsageCount[service.name]}
                  </span>
                </div>
              )}

              {demoMode && (
                <button
                  className={styles.simulateButton}
                  onClick={() => handleSimulateOutage(service.name)}
                >
                  {service.status === 'down' ? '✓ Restore Service' : '⚠️ Simulate Outage'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Services are polled every 5 seconds. Circuit breakers protect against cascading failures.
        </p>
      </div>
    </div>
  );
}
