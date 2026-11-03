import { afterEach, describe, expect, it, vi } from 'vitest';

describe.each([
  ['pet-management-main.js', 'pet-management.html'],
  ['medical-history-main.js', 'medical-history.html'],
])('%s', (file, href) => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('arranca la página al cargar el módulo', async () => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]')));
    await import(`../src/js/${file}`);
    expect(document.querySelector(`#site-header a[href="${href}"]`)).not.toBeNull();
  });
});
