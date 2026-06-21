import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../lib/format';

interface HistoryItem {
  fromState: string | null;
  toState: string;
  actorType: string;
  occurredAt: string;
  reason: string | null;
}

export function TransferTimeline({ history }: { history: HistoryItem[] }) {
  return (
    <ol className="timeline" aria-label="Transfer status timeline">
      {history.map((item, index) => (
        <li key={`${item.occurredAt}-${String(index)}`}>
          <div className="timeline-head">
            <StatusBadge state={item.toState} />
            <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
          </div>
          <p className="muted timeline-meta">
            {item.actorType}
            {item.reason ? ` — ${item.reason}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}
