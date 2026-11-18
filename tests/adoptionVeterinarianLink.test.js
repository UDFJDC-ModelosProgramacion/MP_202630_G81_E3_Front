import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/adoption.js';
import { jsonResponse } from './helpers.js';

describe('enlace al veterinario en la página de adopción', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 204)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lleva a la asignación de veterinario de la misma adopción', async () => {
    await init(document, '?adoption=7');

    const link = document.querySelector('a[href^="adoption-veterinarian.html"]');
    expect(link.getAttribute('href')).toBe('adoption-veterinarian.html?adoption=7');
  });
});
