import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPetBreed } from '../src/js/api/petBreedApi.js';
import { jsonResponse } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

describe('getPetBreed', () => {
  it('consulta GET /api/pets/{id}/breed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1, name: 'Criollo' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getPetBreed(7)).resolves.toEqual({ id: 1, name: 'Criollo' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/7/breed');
  });
});
