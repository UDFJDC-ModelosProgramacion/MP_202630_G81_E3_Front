import { todayIso } from '../utils/ui.js';

export const MAX_TEXT_LENGTH = 255;

/** Vacunas con próxima dosis hoy o más adelante, de la más cercana a la más lejana. */
export function upcomingVaccinations(vaccinations = [], today = todayIso()) {
  return vaccinations
    .filter((vaccination) => vaccination.nextDueDate && vaccination.nextDueDate >= today)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}

/** Valida una vacuna; devuelve `{ campo: mensaje }` solo con lo que está mal. */
export function validateVaccination(
  { name, applicationDate, nextDueDate, notes },
  today = todayIso(),
) {
  const errors = {};
  if (!name) errors.name = 'El nombre de la vacuna es obligatorio.';
  else if (name.length > MAX_TEXT_LENGTH)
    errors.name = `El nombre no puede superar los ${MAX_TEXT_LENGTH} caracteres.`;
  if (!applicationDate) errors.applicationDate = 'La fecha de aplicación es obligatoria.';
  else if (applicationDate > today)
    errors.applicationDate = 'La fecha de aplicación no puede ser futura.';
  if (nextDueDate && applicationDate && nextDueDate < applicationDate)
    errors.nextDueDate = 'La próxima dosis no puede ser anterior a la aplicación.';
  if (notes && notes.length > MAX_TEXT_LENGTH)
    errors.notes = `Las notas no pueden superar los ${MAX_TEXT_LENGTH} caracteres.`;
  return errors;
}
