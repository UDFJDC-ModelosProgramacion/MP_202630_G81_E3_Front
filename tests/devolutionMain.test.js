import { afterEach, describe, expect, it, vi } from 'vitest';

describe('devolution-main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('arranca la página al cargar el módulo', async () => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn());

    await import('../src/js/devolution-main.js');

    await vi.waitFor(() =>
      expect(document.querySelector('.state__title').textContent).toBe('Falta la adopción'),
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
