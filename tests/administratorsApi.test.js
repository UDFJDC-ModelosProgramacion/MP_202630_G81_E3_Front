import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  associateShelter,
  createAdministrator,
  deleteAdministrator,
  listAdministrators,
} from '../src/js/api/administratorsApi.js';
import { listShelters } from '../src/js/api/sheltersApi.js';

function lastRequest() {
  const [url, init] = fetch.mock.calls.at(-1);
  return { url, init };
}

describe('administratorsApi y sheltersApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista los administradores con GET /administrators', async () => {
    await listAdministrators();
    const { url, init } = lastRequest();
    expect(url).toBe('/api/administrators');
    expect(init.method).toBe('GET');
  });

  it('crea un administrador con POST y cuerpo JSON', async () => {
    const administrator = { name: 'Marta', email: 'marta@huellitas.org', role: 'DIRECTOR' };
    await createAdministrator(administrator);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/administrators');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(administrator);
  });

  it('elimina un administrador con DELETE y devuelve null con 204', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteAdministrator(3)).resolves.toBeNull();
    const { url, init } = lastRequest();
    expect(url).toBe('/api/administrators/3');
    expect(init.method).toBe('DELETE');
  });

  it('asocia un refugio con POST sin cuerpo', async () => {
    await associateShelter(1, 2);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/administrators/1/shelters/2');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('lista los refugios con GET /shelters', async () => {
    await listShelters();
    expect(lastRequest().url).toBe('/api/shelters');
  });
});
