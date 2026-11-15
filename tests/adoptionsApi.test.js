import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdoption } from '../src/js/api/adoptionsApi.js';
import { ApiError } from '../src/js/api/httpClient.js';
import { jsonResponse } from './helpers.js';

describe('adoptionsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getAdoption consulta el detalle de la adopción por su id', async () => {
    const adoption = { id: 7, adoptionDate: '2026-03-16', status: 'IN_PROGRESS' };
    fetch.mockResolvedValue(jsonResponse(adoption));

    await expect(getAdoption(7)).resolves.toEqual(adoption);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoptions/7',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('codifica el id en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getAdoption('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/a%2Fb');
  });

  it('propaga el ApiError con el mensaje del back', async () => {
    fetch.mockResolvedValue(
      jsonResponse({ apierror: { message: 'La adopción con ID 9 no fue encontrada.' } }, 404),
    );

    const error = await getAdoption(9).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('La adopción con ID 9 no fue encontrada.');
  });
});
