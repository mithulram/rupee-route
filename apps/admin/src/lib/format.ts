export function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatAmount(amount: string, currency: string): string {
  return `${amount} ${currency}`;
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length * 2) return id;
  return `${id.slice(0, length)}…${id.slice(-4)}`;
}
