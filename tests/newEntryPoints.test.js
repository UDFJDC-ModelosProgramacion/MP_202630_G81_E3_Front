import { afterEach, describe, expect, it, vi } from 'vitest';

describe.each([
  ['vaccinations-main.js', 'vacunacion.html', '?pet=1'],
  ['coexistence-main.js', 'convivencia.html', '?adoption=1'],
  ['adoption-requests-main.js', 'solicitudes.html', ''],
  ['messages-main.js', 'mensajes.html', ''],
  ['calendar-main.js', 'calendario.html', ''],
  ['reports-main.js', 'reportes.html', ''],
  ['adopter-updates-main.js', 'actualizaciones.html', ''],
  ['vet-adoptions-main.js', 'veterinario-adopciones.html', ''],
  ['stories-main.js', 'historias.html', ''],
])('%s', (file, _page, search) => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    window.history.replaceState({}, '', '/');
  });

  it('arranca sin errores y pinta la cabecera y el contenido', async () => {
    window.history.replaceState({}, '', `/${search}`);
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]')),
    );
    await import(`../src/js/${file}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.querySelector('#site-header nav')).not.toBeNull();
    expect(document.querySelector('#app').children.length).toBeGreaterThan(0);
  });
});
