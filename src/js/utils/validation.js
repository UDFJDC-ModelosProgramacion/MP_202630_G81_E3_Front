const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function validateEmail(email) {
  if (isBlank(email)) return 'El correo es obligatorio.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'El correo no tiene un formato válido.';
  return null;
}

/**
 * Valida los datos de un administrador.
 * Devuelve un objeto `{ campo: mensaje }`; vacío si todo es válido.
 */
export function validateAdministrator({ name, email, role }) {
  const errors = {};
  if (isBlank(name)) errors.name = 'El nombre es obligatorio.';
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (isBlank(role)) errors.role = 'El rol es obligatorio.';
  return errors;
}
