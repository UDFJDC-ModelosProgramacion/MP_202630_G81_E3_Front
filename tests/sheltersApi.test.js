import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { getShelter, listShelters } from '../src/js/api/sheltersApi.js';
import { jsonResponse } from './helpers.js';

describe('sheltersApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listShelters sin ciudad consulta todos los refugios', async () => {
    const shelters = [{ id: 1, name: 'Huellitas', city: 'Bogotá' }];
    fetch.mockResolvedValue(jsonResponse(shelters));

    await expect(listShelters()).resolves.toEqual(shelters);
    expect(fetch).toHaveBeenCalledWith('/api/shelters', expect.objectContaining({ method: 'GET' }));
  });

  it('listShelters envía la ciudad codificada', async () => {
    fetch.mockResolvedValue(jsonResponse([]));

    await listShelters({ city: 'Bogotá' });

    expect(fetch.mock.calls[0][0]).toBe('/api/shelters?city=Bogot%C3%A1');
  });

  it('listShelters omite la ciudad vacía', async () => {
    fetch.mockResolvedValue(jsonResponse([]));

    await listShelters({ city: '' });

    expect(fetch.mock.calls[0][0]).toBe('/api/shelters');
  });

  it('getShelter trae el refugio con sus asociaciones', async () => {
    const shelter = { id: 3, name: 'Patitas', city: 'Medellín', pets: [], events: [] };
    fetch.mockResolvedValue(jsonResponse(shelter));

    await expect(getShelter(3)).resolves.toEqual(shelter);
    expect(fetch.mock.calls[0][0]).toBe('/api/shelters/3');
  });

  it('getShelter codifica el id en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getShelter('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/shelters/a%2Fb');
  });

  it('propaga el ApiError 404 con el mensaje del back', async () => {
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Refugio no encontrado' } }, 404));

    const error = await getShelter(0).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Refugio no encontrado');
  });
});
