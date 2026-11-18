import { GENDERS, MAX_AGE, MIN_AGE } from '../domain/veterinarians.js';

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function validateAge(age) {
  if (isBlank(String(age ?? ''))) return 'La edad es obligatoria.';
  const value = Number(age);
  if (!Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) {
    return `La edad debe ser un número entero entre ${MIN_AGE} y ${MAX_AGE}.`;
  }
  return null;
}

/**
 * Valida los datos de un veterinario y el refugio en el que se registra.
 * Devuelve un objeto `{ campo: mensaje }`; vacío si todo es válido.
 */
export function validateVeterinarian({ name, speciality, shelterId, email, phone, availability }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'El nombre es obligatorio.';
  if (isBlank(speciality)) errors.speciality = 'La especialidad es obligatoria.';
  const ageError = validateAge(age);
  if (ageError) errors.age = ageError;
  if (!GENDERS.some((option) => option.value === gender)) errors.gender = 'Selecciona el género.';
  if (isBlank(shelterId)) errors.shelterId = 'Selecciona el refugio donde trabaja.';
  if (!isBlank(email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Escribe un correo válido.';
  if (!isBlank(phone) && !/^[0-9+()\-\s]{7,20}$/.test(phone.trim()))
    errors.phone = 'Escribe un teléfono válido.';
  if (typeof availability === 'string' && availability.trim().length > 255)
    errors.availability = 'La disponibilidad no puede superar los 255 caracteres.';
  return errors;
}
