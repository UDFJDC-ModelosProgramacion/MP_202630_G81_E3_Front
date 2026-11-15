import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAvailablePets } from '../src/js/api/petsApi.js';
import { jsonResponse } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

describe('getAvailablePets', () => {
  it('consulta /pets/available enviando solo los filtros con valor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getAvailablePets({ activityLevel: 'HIGH', spaceRequirement: '' }),
    ).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/available?activityLevel=HIGH');
  });

  it('sin filtros no agrega parámetros', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    await getAvailablePets();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/available');
  });
});
