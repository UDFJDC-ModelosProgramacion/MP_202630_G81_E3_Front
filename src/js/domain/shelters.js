/** Ciudades distintas de los refugios, ordenadas alfabéticamente. */
export function citiesOf(shelters) {
  const cities = shelters.map((shelter) => shelter.city).filter(Boolean);
  return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
}

export const petCountOf = (shelter) => shelter.pets?.length ?? 0;

export function petCountLabel(count) {
  return `${count} ${count === 1 ? 'mascota' : 'mascotas'}`;
}

const isBlank = (value) => typeof value !== 'string' || value.trim() === '';

/**
 * Valida los datos de un refugio.
 * Devuelve `{ campo: mensaje }`; vacío si todo es válido.
 */
export function validateShelter({ name, city }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'El nombre es obligatorio.';
  if (isBlank(city)) errors.city = 'La ciudad es obligatoria.';
  return errors;
}