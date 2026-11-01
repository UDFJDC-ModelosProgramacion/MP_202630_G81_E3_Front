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

const LONG_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function dateParts(value) {
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? null
      : [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  }
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? [year, month, day] : null;
}

/** Fecha del API como "yyyy-mm-dd" (para el atributo `datetime`), o `null` si no es válida. */
export function toIsoDate(value) {
  const parts = dateParts(value);
  if (!parts) return null;
  const [year, month, day] = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "16 de marzo de 2026"; "Fecha no disponible" si la fecha no es válida. */
export function formatLongDate(value) {
  const parts = dateParts(value);
  if (!parts) return 'Fecha no disponible';
  const [year, month, day] = parts;
  return `${day} de ${LONG_MONTHS[month - 1]} de ${year}`;
}
