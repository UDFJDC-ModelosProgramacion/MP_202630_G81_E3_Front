import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { deleteAdopter, getAdopter, listAdopters } from '../src/js/api/adoptersApi.js';
import { jsonResponse } from './helpers.js';

describe('adoptersApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listAdopters consulta el listado', async () => {
    const adopters = [{ id: 1, name: 'Ana', phone: '300' }];
    fetch.mockResolvedValue(jsonResponse(adopters));

    await expect(listAdopters()).resolves.toEqual(adopters);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adopters',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getAdopter trae el adoptante con sus adopciones', async () => {
    const adopter = { id: 2, name: 'Luis', phone: '311', adoptions: [{ id: 5 }] };
    fetch.mockResolvedValue(jsonResponse(adopter));

    await expect(getAdopter(2)).resolves.toEqual(adopter);
    expect(fetch.mock.calls[0][0]).toBe('/api/adopters/2');
  });

  it('deleteAdopter usa DELETE y acepta 204 sin cuerpo', async () => {
    fetch.mockResolvedValue(jsonResponse(null, 204));

    await expect(deleteAdopter(2)).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/adopters/2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('codifica el id en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getAdopter('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/adopters/a%2Fb');
  });

  it('propaga el ApiError 404 con el mensaje del back', async () => {
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Adopter not found' } }, 404));

    const error = await getAdopter(9).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
  });
});
