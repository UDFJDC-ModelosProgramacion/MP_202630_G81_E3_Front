import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { listRequirements } from '../src/js/api/requirementsApi.js';
import { jsonResponse } from './helpers.js';

describe('requirementsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listRequirements consulta los requisitos de adopción', async () => {
    const requirements = [{ id: 1, description: 'Tener patio cerrado.' }];
    fetch.mockResolvedValue(jsonResponse(requirements));

    await expect(listRequirements()).resolves.toEqual(requirements);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoption-requirements',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('propaga el ApiError cuando el servidor falla', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'Error interno' }, 500));

    const error = await listRequirements().catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
  });
});
