import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdoption } from '../src/js/api/adoptionsApi.js';
import { createDevolution, getDevolution } from '../src/js/api/devolutionApi.js';
import { ApiError } from '../src/js/api/httpClient.js';
import { jsonResponse } from './helpers.js';

describe('devolutionApi y adoptionsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getDevolution consulta la devolución de la adopción', async () => {
    const devolution = { id: 1, date: '2026-09-15', reason: 'Cambio de ciudad' };
    fetch.mockResolvedValue(jsonResponse(devolution));

    await expect(getDevolution(7)).resolves.toEqual(devolution);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoptions/7/devolution',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createDevolution envía solo fecha y motivo por POST', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 2, date: '2026-09-15', reason: 'x' }, 201));

    const created = await createDevolution(7, { date: '2026-09-15', reason: 'x', id: 99 });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/adoptions/7/devolution');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ date: '2026-09-15', reason: 'x' });
    expect(created.id).toBe(2);
  });

  it('codifica el id de la adopción en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getDevolution('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/a%2Fb/devolution');
  });

  it('propaga el ApiError 412 con el mensaje del back', async () => {
    const message = 'La adopción ya tiene una devolución registrada';
    fetch.mockResolvedValue(jsonResponse({ apierror: { message } }, 412));

    const error = await createDevolution(7, { date: '2026-09-15', reason: 'x' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(412);
    expect(error.message).toBe(message);
  });

  it('getAdoption consulta la adopción por su id', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 7, adoptionDate: '2026-09-01' }));

    await expect(getAdoption(7)).resolves.toEqual({ id: 7, adoptionDate: '2026-09-01' });
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/7');
  });
});
