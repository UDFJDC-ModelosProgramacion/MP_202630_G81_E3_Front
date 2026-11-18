import { ApiError } from '../api/httpClient.js';

/** Problema de validación de un formulario: su mensaje se muestra tal cual al usuario. */
export class FormError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormError';
  }
}

export function friendlyMessage(error) {
  if (error instanceof FormError) return error.message;
  if (error instanceof ApiError) {
    if (error.isNetworkError) return error.message;
    if (error.status === 404 || error.status === 412) return error.message;
    return 'Ocurrió un problema en el servidor. Inténtalo de nuevo más tarde.';
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
