function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * Valida los datos de un veterinario y el refugio en el que se registra.
 * Devuelve un objeto `{ campo: mensaje }`; vacío si todo es válido.
 */
export function validateVeterinarian({ name, speciality, shelterId }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'El nombre es obligatorio.';
  if (isBlank(speciality)) errors.speciality = 'La especialidad es obligatoria.';
  if (isBlank(shelterId)) errors.shelterId = 'Selecciona el refugio donde trabaja.';
  return errors;
}
