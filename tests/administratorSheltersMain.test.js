import { afterEach, describe, expect, it, vi } from 'vitest';

describe('administrator-shelters-main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('arranca la página al cargar el módulo', async () => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn());

    await import('../src/js/administrator-shelters-main.js');

    await vi.waitFor(() =>
      expect(document.querySelector('.state__title').textContent).toBe('Falta el administrador'),
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
