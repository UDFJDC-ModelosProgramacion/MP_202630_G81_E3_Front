export const SEX_OPTIONS = [
  { value: 'Hembra', label: 'Hembra' },
  { value: 'Macho', label: 'Macho' },
];

export const SIZE_OPTIONS = [
  { value: 'Tamaño pequeño', label: 'Pequeño' },
  { value: 'Tamaño mediano', label: 'Mediano' },
  { value: 'Tamaño grande', label: 'Grande' },
];

export const LEVEL_LABELS = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' };

export const EMPTY_FILTERS = Object.freeze({
  species: '',
  minAge: '',
  maxAge: '',
  activityLevel: '',
  spaceRequirement: '',
  size: '',
  sex: '',
  children: false,
  otherPets: false,
});

/** Filtros que resuelve el back en `/pets/available`. */
export function serverFilters({ activityLevel, spaceRequirement, species, minAge, maxAge }) {
  return { activityLevel, spaceRequirement, species, minAge, maxAge };
}

/**
 * Aplica en el cliente los filtros que el back no ofrece: tamaño, sexo y compatibilidad.
 * La compatibilidad solo restringe cuando está marcada (solo se muestran las compatibles).
 */
export function applyClientFilters(pets, { size, sex, children, otherPets }) {
  return pets.filter(
    (pet) =>
      (!size || pet.size === size) &&
      (!sex || pet.sex === sex) &&
      (!children || pet.compatibleWithChildren === true) &&
      (!otherPets || pet.compatibleWithOtherPets === true),
  );
}

/** Valores distintos y ordenados de un campo de texto, para armar las opciones de un filtro. */
export function distinctValues(pets, field) {
  const values = pets
    .map((pet) => pet[field])
    .filter((value) => typeof value === 'string' && value);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function hasActiveFilters(filters) {
  return Object.keys(EMPTY_FILTERS).some((key) => filters[key] !== EMPTY_FILTERS[key]);
}

const optionLabel = (options, value) => options.find((o) => o.value === value)?.label ?? value;

/** Un chip por filtro activo, en el orden del formulario: `{ key, label }`. */
export function activeFilterChips(filters) {
  const chips = [];
  const add = (key, label) => chips.push({ key, label });
  if (filters.species) add('species', `Especie: ${filters.species}`);
  if (filters.minAge !== '') add('minAge', `Edad mínima: ${filters.minAge}`);
  if (filters.maxAge !== '') add('maxAge', `Edad máxima: ${filters.maxAge}`);
  if (filters.activityLevel) {
    add(
      'activityLevel',
      `Actividad: ${LEVEL_LABELS[filters.activityLevel] ?? filters.activityLevel}`,
    );
  }
  if (filters.spaceRequirement) {
    add(
      'spaceRequirement',
      `Espacio: ${LEVEL_LABELS[filters.spaceRequirement] ?? filters.spaceRequirement}`,
    );
  }
  if (filters.size) add('size', `Tamaño: ${optionLabel(SIZE_OPTIONS, filters.size)}`);
  if (filters.sex) add('sex', `Sexo: ${optionLabel(SEX_OPTIONS, filters.sex)}`);
  if (filters.children) add('children', 'Compatible con niños');
  if (filters.otherPets) add('otherPets', 'Compatible con otras mascotas');
  return chips;
}
