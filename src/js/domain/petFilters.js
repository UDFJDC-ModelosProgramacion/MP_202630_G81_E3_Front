export const SEX_OPTIONS = [
  { value: 'Hembra', label: 'Hembra' },
  { value: 'Macho', label: 'Macho' },
];

export const SIZE_OPTIONS = [
  { value: 'Tamaño pequeño', label: 'Pequeño' },
  { value: 'Tamaño mediano', label: 'Mediano' },
  { value: 'Tamaño grande', label: 'Grande' },
];

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

export function serverFilters({ activityLevel, spaceRequirement, species, minAge, maxAge }) {
  return { activityLevel, spaceRequirement, species, minAge, maxAge };
}

export function applyClientFilters(pets, { size, sex, children, otherPets }) {
  return pets.filter(
    (pet) =>
      (!size || pet.size === size) &&
      (!sex || pet.sex === sex) &&
      (!children || pet.compatibleWithChildren === true) &&
      (!otherPets || pet.compatibleWithOtherPets === true),
  );
}

export function distinctValues(pets, field) {
  const values = pets
    .map((pet) => pet[field])
    .filter((value) => typeof value === 'string' && value);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function hasActiveFilters(filters) {
  return Object.keys(EMPTY_FILTERS).some((key) => filters[key] !== EMPTY_FILTERS[key]);
}
