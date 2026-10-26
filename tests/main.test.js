import { beforeEach, describe, expect, it } from 'vitest';
import { init } from '../src/js/main.js';

describe('init', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header>';
  });

  it('monta el encabezado y marca el inicio como página actual', () => {
    init(document);
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Inicio');
  });

  it('incluye el enlace a la página de administradores', () => {
    init(document);
    const link = document.querySelector('a[href="administradores.html"]');
    expect(link.textContent).toBe('Administradores');
  });

  it('no falla si la página no tiene encabezado', () => {
    document.body.innerHTML = '';
    expect(() => init(document)).not.toThrow();
  });
});
