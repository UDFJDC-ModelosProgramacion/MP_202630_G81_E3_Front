import { afterEach, describe, expect, it, vi } from 'vitest';

describe('devolution-history-main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('arranca la página al cargar el módulo', async () => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200 })),
    );

    await import('../src/js/devolution-history-main.js');

    await vi.waitFor(() => expect(document.querySelector('.state--empty')).not.toBeNull());
    expect(document.querySelector('h1').textContent).toBe('Historial de devoluciones');
    expect(fetch.mock.calls[0][0]).toBe('/api/devolutions');
  });
});