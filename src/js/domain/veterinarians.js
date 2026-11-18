export const MIN_AGE = 18;
export const MAX_AGE = 100;

/** Género del veterinario (valor enviado al back → etiqueta). */
export const GENDERS = [
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'OTHER', label: 'Otro' },
];

/** Estados de una adopción en los que sigue viva: solo entonces puede tener veterinario. */
export const ACTIVE_ADOPTION_STATUSES = ['IN_PROGRESS', 'COHABITATION'];

export function genderLabel(value) {
  return GENDERS.find((gender) => gender.value === value)?.label ?? 'No indicado';
}

export function isActiveAdoption(adoption) {
  return ACTIVE_ADOPTION_STATUSES.includes(adoption?.status);
}

/** `available` lo calcula el back; si no llega se asume disponible. */
export function isAvailable(veterinarian) {
  return veterinarian?.available !== false;
}
