/** Valor para un `<input type="date">` a partir de lo que devuelve el back (texto ISO o milisegundos). */
export function toInputDate(value) {
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  const match = typeof value === 'string' ? /^(\d{4}-\d{2}-\d{2})/.exec(value) : null;
  return match ? match[1] : '';
}

/** Suma días a una fecha yyyy-mm-dd (en UTC, para no depender de la zona horaria). */
export function addDaysIso(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
