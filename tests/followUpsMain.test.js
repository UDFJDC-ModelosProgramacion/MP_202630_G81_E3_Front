import { describe, expect, it, vi } from 'vitest';

describe('follow-ups-main', () => {
  it('arranca la página al cargar el módulo', async () => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]')));
    await import('../src/js/follow-ups-main.js');
    expect(document.querySelector('#site-header a[href="follow-ups.html"]')).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
