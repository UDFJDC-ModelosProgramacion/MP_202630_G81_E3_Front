/** Estados de adaptación que puede registrar el adoptante (valor enviado al back → etiqueta). */
export const ADAPTATION_STATUSES = [
  { value: 'ADAPTING', label: 'En adaptación' },
  { value: 'GOOD', label: 'Adaptación buena' },
  { value: 'EXCELLENT', label: 'Adaptación excelente' },
  { value: 'DIFFICULT', label: 'Adaptación difícil' },
];

export const MAX_OBSERVATIONS_LENGTH = 255;

/** Estados de una adopción que aún no se concreta o ya no sigue: no admiten seguimiento. */
const NOT_FOLLOWABLE = new Set(['PENDING', 'IN_PROGRESS', 'CANCELLED', 'CANCELED', 'REJECTED']);

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function statusLabel(value) {
  return ADAPTATION_STATUSES.find((status) => status.value === value)?.label ?? 'Sin estado';
}

/** Fecha local de hoy como "yyyy-mm-dd" (valor por defecto y tope del campo fecha). */
export function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isRealDate(value) {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Valida un seguimiento. Devuelve `{ campo: mensaje }` solo con lo que falta o está mal;
 * vacío si todo es válido.
 */
export function validateFollowUp({ date, adaptationStatus, observations }, today = todayIso()) {
  const errors = {};
  const dateText = String(date ?? '').trim();
  if (!dateText) {
    errors.date = 'La fecha es obligatoria.';
  } else if (!isRealDate(dateText)) {
    errors.date = 'La fecha no es válida.';
  } else if (dateText > today) {
    errors.date = 'La fecha no puede ser futura.';
  }

  if (!ADAPTATION_STATUSES.some((status) => status.value === adaptationStatus)) {
    errors.adaptationStatus = 'Elige el estado de adaptación.';
  }

  const text = String(observations ?? '').trim();
  if (!text) {
    errors.observations = 'Las observaciones son obligatorias.';
  } else if (text.length > MAX_OBSERVATIONS_LENGTH) {
    errors.observations = `Las observaciones no superan los ${MAX_OBSERVATIONS_LENGTH} caracteres.`;
  }
  return errors;
}

/** Adopciones del adoptante que admiten seguimiento (ya concretadas, no pendientes ni canceladas). */
export function followableAdoptions(adoptions = []) {
  return adoptions.filter((adoption) => !NOT_FOLLOWABLE.has(String(adoption.status).toUpperCase()));
}

/** Nombre de la mascota de una adopción, tolerando que el back no la envíe. */
export const petNameOf = (adoption) => adoption.pet?.name ?? 'Mascota sin nombre';

/** Seguimientos del más reciente al más antiguo (empata por id). No modifica el arreglo. */
export function sortFollowUps(followUps = []) {
  return [...followUps].sort(
    (a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')) ||
      Number(b.id ?? 0) - Number(a.id ?? 0),
  );
}
