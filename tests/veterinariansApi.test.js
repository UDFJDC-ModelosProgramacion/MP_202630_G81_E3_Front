import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVeterinarian, listShelterVeterinarians } from '../src/js/api/veterinariansApi.js';

function lastRequest() {
  const [url, init] = fetch.mock.calls.at(-1);
  return { url, init };
}

describe('veterinariansApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista los veterinarios de un refugio con GET', async () => {
    await listShelterVeterinarians(3);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/shelters/3/veterinarians');
    expect(init.method).toBe('GET');
  });

  it('registra un veterinario con POST y cuerpo JSON', async () => {
    const veterinarian = { name: 'Laura Ruiz', speciality: 'Cirugía' };
    await createVeterinarian(3, veterinarian);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/shelters/3/veterinarians');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(veterinarian);
  });
});
