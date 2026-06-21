const STATUS_CLASS: Record<string, string> = {
  pending: 'badge-warning',
  open: 'badge-warning',
  in_progress: 'badge-info',
  running: 'badge-info',
  completed: 'badge-success',
  resolved: 'badge-success',
  approved: 'badge-success',
  healthy: 'badge-success',
  closed: 'badge-muted',
  declined: 'badge-error',
  rejected: 'badge-error',
  failed: 'badge-error',
  down: 'badge-error',
  degraded: 'badge-warning',
};

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  const className = STATUS_CLASS[normalized] ?? 'badge-muted';
  return <span className={`badge ${className}`}>{value}</span>;
}
