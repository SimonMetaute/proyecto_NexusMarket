const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatMoney(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return currencyFormatter.format(value);
}

export function formatDate(value: string | undefined | null): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFormatter.format(date);
}

export function shortId(value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    return '—';
  }
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}
