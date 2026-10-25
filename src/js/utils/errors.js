import { ApiError } from '../api/httpClient.js';

/**
 * Convierte cualquier error en un texto entendible para la persona usuaria.
 * Los mensajes del back (404, 412) se muestran tal cual; el resto se resume.
 */
export function friendlyMessage(error) {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return error.message;
    if (error.status === 404 || error.status === 412) return error.message;
    return 'Ocurrió un problema en el servidor. Inténtalo de nuevo más tarde.';
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
