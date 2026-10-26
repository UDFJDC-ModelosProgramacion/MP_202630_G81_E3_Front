import { ApiError } from '../api/httpClient.js';

export function friendlyMessage(error) {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return error.message;
    if (error.status === 404 || error.status === 412) return error.message;
    return 'Ocurrió un problema en el servidor. Inténtalo de nuevo más tarde.';
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
