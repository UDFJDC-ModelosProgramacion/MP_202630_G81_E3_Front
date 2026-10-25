import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { friendlyMessage } from '../src/js/utils/errors.js';

describe('friendlyMessage', () => {
  it('muestra el mensaje de red tal cual', () => {
    const error = new ApiError('No se pudo conectar con el servidor.', { status: 0 });
    expect(friendlyMessage(error)).toBe('No se pudo conectar con el servidor.');
  });

  it.each([404, 412])('muestra el mensaje del back en %s', (status) => {
    expect(friendlyMessage(new ApiError('Resource not found', { status }))).toBe(
      'Resource not found',
    );
  });

  it('resume los errores del servidor', () => {
    expect(friendlyMessage(new ApiError('boom', { status: 500 }))).toBe(
      'Ocurrió un problema en el servidor. Inténtalo de nuevo más tarde.',
    );
  });

  it('resume cualquier otro error', () => {
    expect(friendlyMessage(new Error('x'))).toBe(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
  });
});
