import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, request } from '../src/js/api/httpClient.js';

function jsonResponse(body, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status });
}

describe('buildUrl', () => {
  it('antepone el prefijo /api', () => {
    expect(buildUrl('/items')).toBe('/api/items');
  });

  it('omite parámetros vacíos, nulos e indefinidos', () => {
    const url = buildUrl('/items/search', {
      category: 'A',
      filter: '',
      other: null,
      missing: undefined,
    });
    expect(url).toBe('/api/items/search?category=A');
  });

  it('codifica los valores', () => {
    expect(buildUrl('/items', { q: 'dos palabras' })).toBe('/api/items?q=dos+palabras');
  });
});

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('devuelve el JSON de una respuesta exitosa', async () => {
    fetch.mockResolvedValue(jsonResponse([{ id: 1 }]));
    await expect(request('/items')).resolves.toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }),
    );
  });

  it('envía el cuerpo como JSON', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 2 }, 201));
    await request('/items', { method: 'POST', body: { name: 'Ejemplo' } });
    const [, init] = fetch.mock.calls[0];
    expect(init.body).toBe('{"name":"Ejemplo"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('devuelve null con 204', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(request('/items/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('usa el mensaje del back (apierror) en errores HTTP', async () => {
    fetch.mockResolvedValue(
      jsonResponse({ apierror: { status: 'NOT_FOUND', message: 'Resource not found' } }, 404),
    );
    const error = await request('/items/99').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Resource not found');
    expect(error.isNotFound).toBe(true);
    expect(error.isNetworkError).toBe(false);
  });

  it('usa un mensaje genérico si el error no trae JSON', async () => {
    fetch.mockResolvedValue(new Response('<html>boom</html>', { status: 500 }));
    const error = await request('/items').catch((e) => e);
    expect(error.status).toBe(500);
    expect(error.message).toBe('Error 500 del servidor.');
  });

  it('convierte fallos de red en ApiError con status 0', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await request('/items').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isNetworkError).toBe(true);
    expect(error.message).toBe('No se pudo conectar con el servidor.');
  });

  it('informa cuando se agota el tiempo de espera', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('abortada', 'AbortError')),
          );
        }),
    );
    const pending = request('/items', { timeoutMs: 50 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(60);
    const error = await pending;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('El servidor tardó demasiado en responder.');
  });

  it('propaga la cancelación hecha por quien llama', async () => {
    const controller = new AbortController();
    fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('cancelada', 'AbortError')),
          );
        }),
    );
    const pending = request('/items', { signal: controller.signal }).catch((e) => e);
    controller.abort();
    const error = await pending;
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.name).toBe('AbortError');
  });
});
