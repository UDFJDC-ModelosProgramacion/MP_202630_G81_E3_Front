import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/available.js';
import { init as initPets } from '../src/js/pets.js';
import { jsonResponse, until } from './helpers.js';

describe('páginas de mascotas', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('disponibles: marca el enlace actual y carga el listado', async () => {
    await init(document);
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Disponibles');
    expect(fetch.mock.calls[0][0]).toBe('/api/pets/available');
  });

  it('disponibles: sin contenedor no falla', async () => {
    document.body.innerHTML = '';
    await expect(init(document)).resolves.toBeUndefined();
  });

  it('mascotas: marca el enlace actual y carga el listado', async () => {
    initPets(document);
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Mascotas');
    await until(() => document.querySelector('.state--empty'));
    expect(fetch.mock.calls[0][0]).toBe('/api/pets');
  });

  it('mascotas: sin contenedor no falla', () => {
    document.body.innerHTML = '';
    expect(() => initPets(document)).not.toThrow();
  });
});
