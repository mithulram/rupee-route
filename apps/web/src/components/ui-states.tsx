export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="state-message" role="status" aria-live="polite">
      {label}
    </p>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Retry',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="state-message error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="state-message muted" role="status">
      {message}
    </p>
  );
}
