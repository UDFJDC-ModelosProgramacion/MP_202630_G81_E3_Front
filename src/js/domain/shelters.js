/** Ciudades distintas de los refugios, ordenadas alfabéticamente. */
export function citiesOf(shelters) {
  const cities = shelters.map((shelter) => shelter.city).filter(Boolean);
  return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
}

export const petCountOf = (shelter) => shelter.pets?.length ?? 0;

export function petCountLabel(count) {
  return `${count} ${count === 1 ? 'mascota' : 'mascotas'}`;
}
