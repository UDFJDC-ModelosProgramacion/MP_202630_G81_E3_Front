/** Ciudades distintas de los refugios, ordenadas alfabéticamente. */
export function citiesOf(shelters) {
  const cities = shelters.map((shelter) => shelter.city).filter(Boolean);
  return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
}

export const petCountOf = (shelter) => shelter.pets?.length ?? 0;

export function petCountLabel(count) {
  return `${count} ${count === 1 ? 'mascota' : 'mascotas'}`;
}

/** Enlaces (uno por línea) como lista, sin líneas vacías. */
export function splitLinks(text = '') {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const isHttpLink = (value) => /^https?:\/\/\S+$/i.test(value) && value.length <= 255;

/** Valida el registro de un refugio; devuelve el texto del problema o `null`. */
export function validateShelter({ name, city, photos, videos }) {
  if (!name) return 'El nombre del refugio es obligatorio.';
  if (!city) return 'La ciudad es obligatoria.';
  const links = [...splitLinks(photos), ...splitLinks(videos)];
  if (links.some((link) => !isHttpLink(link)))
    return 'Cada enlace debe empezar por http:// o https:// y tener máximo 255 caracteres.';
  return null;
}
