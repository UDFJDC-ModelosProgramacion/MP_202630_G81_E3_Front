const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatDate(value) {
  let parts = null;
  if (typeof value === 'number') {
    const date = new Date(value);
    parts = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  } else if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) parts = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  if (!parts || parts[1] < 1 || parts[1] > 12) return 'Fecha no disponible';
  const [year, month, day] = parts;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
