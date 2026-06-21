export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="state-panel" role="status">
      <h3>{title}</h3>
      {description ? <p className="muted">{description}</p> : null}
    </div>
  );
}
