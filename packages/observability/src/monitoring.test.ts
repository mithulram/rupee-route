import { describe, expect, it } from 'vitest';
import {
  AlertThresholds,
  createMonitoringSnapshot,
  computeWebhookFailureRate,
  evaluateAlerts,
} from './monitoring.js';

describe('monitoring', () => {
  it('defines alert thresholds for operational metrics', () => {
    expect(AlertThresholds.webhook_failure_rate.critical).toBe(15);
    expect(AlertThresholds.reconciliation_exceptions.warning).toBe(1);
    expect(AlertThresholds.queue_depth.unit).toBe('count');
  });

  it('computes webhook failure rate as a percentage', () => {
    expect(
      computeWebhookFailureRate({
        webhookTotal: 100,
        webhookFailed: 12,
        reconciliationExceptions: 0,
        queueDepth: 0,
      }),
    ).toBe(12);
  });

  it('raises warning and critical alerts from metric thresholds', () => {
    const alerts = evaluateAlerts(
      {
        webhookTotal: 100,
        webhookFailed: 16,
        reconciliationExceptions: 2,
        queueDepth: 75,
      },
      new Date('2026-06-20T12:00:00.000Z'),
    );

    expect(alerts.map((alert) => alert.metric)).toEqual([
      'webhook_failure_rate',
      'reconciliation_exceptions',
      'queue_depth',
    ]);
    expect(alerts.find((alert) => alert.metric === 'webhook_failure_rate')?.severity).toBe(
      'critical',
    );
    expect(alerts.find((alert) => alert.metric === 'queue_depth')?.severity).toBe('warning');
  });

  it('creates monitoring snapshot with provider health summaries', () => {
    const snapshot = createMonitoringSnapshot(
      {
        webhookTotal: 50,
        webhookFailed: 10,
        reconciliationExceptions: 0,
        queueDepth: 10,
      },
      new Date('2026-06-20T12:00:00.000Z'),
    );

    expect(snapshot.capturedAt).toBe('2026-06-20T12:00:00.000Z');
    expect(snapshot.metrics).toHaveLength(3);
    expect(snapshot.providers.length).toBeGreaterThan(0);
    expect(snapshot.providers.find((provider) => provider.id === 'webhooks')?.status).toBe('down');
  });

  it('marks providers healthy when metrics are within thresholds', () => {
    const snapshot = createMonitoringSnapshot({
      webhookTotal: 20,
      webhookFailed: 0,
      reconciliationExceptions: 0,
      queueDepth: 5,
    });

    expect(snapshot.alerts).toHaveLength(0);
    expect(snapshot.providers.every((provider) => provider.status === 'healthy')).toBe(true);
  });
});
