import { toIsoDate } from '../utils/format.js';

export const REASON_MAX_LENGTH = 255;
export const DATE_BEFORE_ADOPTION_MESSAGE =
  'La fecha de la devolución no puede ser anterior a la fecha de la adopción';

function isRealDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function validateDate(date, adoptionDate) {
  if (!date) return 'La fecha de la devolución es obligatoria.';
  if (!isRealDate(date)) return 'La fecha de la devolución no es válida.';
  const adoptedOn = toIsoDate(adoptionDate);
  if (adoptedOn && date < adoptedOn) return DATE_BEFORE_ADOPTION_MESSAGE;
  return null;
}

function validateReason(reason) {
  if (!reason) return 'El motivo de la devolución es obligatorio.';
  if (reason.length > REASON_MAX_LENGTH) {
    return `El motivo no puede superar los ${REASON_MAX_LENGTH} caracteres.`;
  }
  return null;
}

export function validateDevolution({ date, reason }, adoptionDate) {
  const errors = {};
  const dateError = validateDate(date, adoptionDate);
  if (dateError) errors.date = dateError;
  const reasonError = validateReason(reason);
  if (reasonError) errors.reason = reasonError;
  return errors;
}
