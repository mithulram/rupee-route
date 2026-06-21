export type MetricName = 'webhook_failure_rate' | 'reconciliation_exceptions' | 'queue_depth';

export type AlertSeverity = 'warning' | 'critical';

export type ProviderHealthStatus = 'healthy' | 'degraded' | 'down';

export interface AlertThreshold {
  metric: MetricName;
  warning: number;
  critical: number;
  unit: 'percent' | 'count';
}

export const AlertThresholds: Record<MetricName, AlertThreshold> = {
  webhook_failure_rate: {
    metric: 'webhook_failure_rate',
    warning: 5,
    critical: 15,
    unit: 'percent',
  },
  reconciliation_exceptions: {
    metric: 'reconciliation_exceptions',
    warning: 1,
    critical: 5,
    unit: 'count',
  },
  queue_depth: {
    metric: 'queue_depth',
    warning: 50,
    critical: 200,
    unit: 'count',
  },
};

export interface MonitoringMetric {
  name: MetricName;
  value: number;
  unit: AlertThreshold['unit'];
  threshold: AlertThreshold;
}

export interface ActiveAlert {
  id: string;
  metric: MetricName;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: string;
}

export interface ProviderHealthSummary {
  id: string;
  name: string;
  status: ProviderHealthStatus;
  lastCheckedAt: string;
  message: string | null;
}

export interface MonitoringCounts {
  webhookTotal: number;
  webhookFailed: number;
  reconciliationExceptions: number;
  queueDepth: number;
}

export interface MonitoringSnapshot {
  capturedAt: string;
  providers: ProviderHealthSummary[];
  metrics: MonitoringMetric[];
  alerts: ActiveAlert[];
}

const SANDBOX_PROVIDERS: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'fx_quote', name: 'FX Quote' },
  { id: 'kyc', name: 'KYC' },
  { id: 'screening', name: 'Screening' },
  { id: 'funding', name: 'Funding' },
  { id: 'payout', name: 'Payout' },
  { id: 'webhooks', name: 'Provider Webhooks' },
  { id: 'notifications', name: 'Notifications' },
];

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeWebhookFailureRate(counts: MonitoringCounts): number {
  if (counts.webhookTotal <= 0) {
    return 0;
  }
  return roundMetric((counts.webhookFailed / counts.webhookTotal) * 100);
}

export function buildMonitoringMetrics(counts: MonitoringCounts): MonitoringMetric[] {
  return [
    {
      name: 'webhook_failure_rate',
      value: computeWebhookFailureRate(counts),
      unit: AlertThresholds.webhook_failure_rate.unit,
      threshold: AlertThresholds.webhook_failure_rate,
    },
    {
      name: 'reconciliation_exceptions',
      value: counts.reconciliationExceptions,
      unit: AlertThresholds.reconciliation_exceptions.unit,
      threshold: AlertThresholds.reconciliation_exceptions,
    },
    {
      name: 'queue_depth',
      value: counts.queueDepth,
      unit: AlertThresholds.queue_depth.unit,
      threshold: AlertThresholds.queue_depth,
    },
  ];
}

function severityForMetric(metric: MonitoringMetric): AlertSeverity | null {
  if (metric.value >= metric.threshold.critical) {
    return 'critical';
  }
  if (metric.value >= metric.threshold.warning) {
    return 'warning';
  }
  return null;
}

function alertMessage(metric: MonitoringMetric, severity: AlertSeverity): string {
  const label = metric.name.replace(/_/g, ' ');
  const unitSuffix = metric.unit === 'percent' ? '%' : '';
  const threshold = severity === 'critical' ? metric.threshold.critical : metric.threshold.warning;

  return `${label} ${severity}: ${String(metric.value)}${unitSuffix} (threshold ${String(threshold)}${unitSuffix})`;
}

export function evaluateAlerts(
  counts: MonitoringCounts,
  triggeredAt: Date = new Date(),
): ActiveAlert[] {
  const metrics = buildMonitoringMetrics(counts);
  const alerts: ActiveAlert[] = [];

  for (const metric of metrics) {
    const severity = severityForMetric(metric);
    if (!severity) {
      continue;
    }

    const threshold =
      severity === 'critical' ? metric.threshold.critical : metric.threshold.warning;

    alerts.push({
      id: `${metric.name}:${severity}`,
      metric: metric.name,
      severity,
      message: alertMessage(metric, severity),
      value: metric.value,
      threshold,
      triggeredAt: triggeredAt.toISOString(),
    });
  }

  return alerts;
}

function providerStatusFromMetrics(
  providerId: string,
  metrics: MonitoringMetric[],
): ProviderHealthStatus {
  if (providerId === 'webhooks') {
    const webhookMetric = metrics.find((metric) => metric.name === 'webhook_failure_rate');
    if (!webhookMetric) {
      return 'healthy';
    }
    if (webhookMetric.value >= webhookMetric.threshold.critical) {
      return 'down';
    }
    if (webhookMetric.value >= webhookMetric.threshold.warning) {
      return 'degraded';
    }
    return 'healthy';
  }

  if (providerId === 'payout' || providerId === 'funding') {
    const queueMetric = metrics.find((metric) => metric.name === 'queue_depth');
    if (!queueMetric) {
      return 'healthy';
    }
    if (queueMetric.value >= queueMetric.threshold.critical) {
      return 'down';
    }
    if (queueMetric.value >= queueMetric.threshold.warning) {
      return 'degraded';
    }
  }

  const reconciliationMetric = metrics.find(
    (metric) => metric.name === 'reconciliation_exceptions',
  );
  if (
    reconciliationMetric &&
    reconciliationMetric.value >= reconciliationMetric.threshold.warning
  ) {
    return 'degraded';
  }

  return 'healthy';
}

function providerMessage(
  providerId: string,
  status: ProviderHealthStatus,
  metrics: MonitoringMetric[],
): string | null {
  if (status === 'healthy') {
    return null;
  }

  if (providerId === 'webhooks') {
    const webhookMetric = metrics.find((metric) => metric.name === 'webhook_failure_rate');
    return webhookMetric
      ? `Webhook failure rate at ${String(webhookMetric.value)}%`
      : 'Webhook processing degraded';
  }

  if (providerId === 'payout' || providerId === 'funding') {
    const queueMetric = metrics.find((metric) => metric.name === 'queue_depth');
    return queueMetric
      ? `Queue depth at ${String(queueMetric.value)} jobs`
      : 'Queue backlog elevated';
  }

  const reconciliationMetric = metrics.find(
    (metric) => metric.name === 'reconciliation_exceptions',
  );
  if (reconciliationMetric && reconciliationMetric.value > 0) {
    return `${String(reconciliationMetric.value)} open reconciliation exception(s)`;
  }

  return 'Operational degradation detected';
}

export function buildProviderHealthSummaries(
  metrics: MonitoringMetric[],
  capturedAt: Date = new Date(),
): ProviderHealthSummary[] {
  return SANDBOX_PROVIDERS.map((provider) => {
    const status = providerStatusFromMetrics(provider.id, metrics);
    return {
      id: provider.id,
      name: provider.name,
      status,
      lastCheckedAt: capturedAt.toISOString(),
      message: providerMessage(provider.id, status, metrics),
    };
  });
}

export function createMonitoringSnapshot(
  counts: MonitoringCounts,
  capturedAt: Date = new Date(),
): MonitoringSnapshot {
  const metrics = buildMonitoringMetrics(counts);
  const alerts = evaluateAlerts(counts, capturedAt);

  return {
    capturedAt: capturedAt.toISOString(),
    providers: buildProviderHealthSummaries(metrics, capturedAt),
    metrics,
    alerts,
  };
}
