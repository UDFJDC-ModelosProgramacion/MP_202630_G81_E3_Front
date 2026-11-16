import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAdministratorShelter,
  listAdministratorShelters,
  unlinkShelter,
} from '../src/js/api/administratorSheltersApi.js';
import { ApiError } from '../src/js/api/httpClient.js';
import { jsonResponse } from './helpers.js';

describe('administratorSheltersApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listAdministratorShelters consulta los refugios del administrador', async () => {
    const shelters = [{ id: 1, name: 'Huellitas', city: 'Bogotá' }];
    fetch.mockResolvedValue(jsonResponse(shelters));

    await expect(listAdministratorShelters(3)).resolves.toEqual(shelters);
    expect(fetch).toHaveBeenCalledWith(
      '/api/administrators/3/shelters',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getAdministratorShelter consulta un refugio del administrador', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 5, name: 'Patitas' }));

    await expect(getAdministratorShelter(3, 5)).resolves.toEqual({ id: 5, name: 'Patitas' });
    expect(fetch.mock.calls[0][0]).toBe('/api/administrators/3/shelters/5');
  });

  it('unlinkShelter usa DELETE y acepta 204 sin cuerpo', async () => {
    fetch.mockResolvedValue(jsonResponse(null, 204));

    await expect(unlinkShelter(3, 5)).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/administrators/3/shelters/5',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('codifica los ids en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getAdministratorShelter('a/b', 'c/d');
    expect(fetch.mock.calls[0][0]).toBe('/api/administrators/a%2Fb/shelters/c%2Fd');
  });

  it('propaga el ApiError 412 con el mensaje del back', async () => {
    const message = 'El refugio no está asociado con el administrador dado';
    fetch.mockResolvedValue(jsonResponse({ apierror: { message } }, 412));

    const error = await getAdministratorShelter(3, 9).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(412);
    expect(error.message).toBe(message);
  });
});
