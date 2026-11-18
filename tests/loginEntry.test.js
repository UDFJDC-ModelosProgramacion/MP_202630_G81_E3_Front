import { afterEach, describe, expect, it, vi } from 'vitest';

describe('login-main.js', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('muestra los roles sin exigir sesión', async () => {
    window.localStorage.clear();
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]')),
    );
    await import('../src/js/login-main.js');
    expect(document.querySelectorAll('.role-card')).toHaveLength(3);
  });
});
