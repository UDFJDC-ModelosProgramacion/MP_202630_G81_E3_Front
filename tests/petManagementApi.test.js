import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPet, getPet, listPets, updatePet } from '../src/js/api/petManagementApi.js';
import { jsonResponse } from './helpers.js';

describe('petManagementApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({})),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('listPets y getPet usan GET', async () => {
    await listPets();
    await getPet(5);
    expect(fetch.mock.calls[0][0]).toBe('/api/pets');
    expect(fetch.mock.calls[1][0]).toBe('/api/pets/5');
    expect(fetch.mock.calls[1][1].method).toBe('GET');
  });

  it('createPet envía POST con el cuerpo', async () => {
    await createPet({ name: 'Luna' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/pets');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ name: 'Luna' });
  });

  it('updatePet envía PUT a la mascota', async () => {
    await updatePet(5, { name: 'Luna' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/pets/5');
    expect(init.method).toBe('PUT');
  });

  it('propaga el ApiError 412 con el mensaje del back', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ apierror: { message: 'Name is not valid' } }, 412));
    await expect(createPet({})).rejects.toMatchObject({
      status: 412,
      message: 'Name is not valid',
    });
  });
});
