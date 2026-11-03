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
  
  it('incluye el enlace a la página de refugios', () => {
    init(document);
    const link = document.querySelector('a[href="shelters.html"]');
    expect(link.textContent).toBe('Refugios');
  });

  it('incluye el enlace a la página de seguimiento', () => {
    init(document);
    const link = document.querySelector('a[href="follow-ups.html"]');
    expect(link.textContent).toBe('Seguimiento');
  });

  it('incluye los enlaces de gestión de mascotas e historial médico', () => {
    init(document);
    expect(document.querySelector('a[href="pet-management.html"]').textContent).toBe(
      'Gestión de mascotas',
    );
    expect(document.querySelector('a[href="medical-history.html"]').textContent).toBe(
      'Historial médico',
    );
  });
});
