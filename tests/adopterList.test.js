import { beforeEach, describe, expect, it } from 'vitest';
import { adopterHref, renderAdopterList } from '../src/js/components/adopterList.js';

describe('renderAdopterList', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('muestra el estado vacío si no hay adoptantes', () => {
    renderAdopterList(container, []);

    expect(container.querySelector('.state__title').textContent).toBe('Aún no hay adoptantes');
    expect(container.querySelector('.adopter-card')).toBeNull();
  });

  it('pinta una tarjeta con nombre y teléfono que enlaza al perfil', () => {
    renderAdopterList(container, [
      { id: 1, name: 'Ana Pérez', phone: '3001234567' },
      { id: 2, name: 'Luis Gómez', phone: '3109876543' },
    ]);

    const cards = container.querySelectorAll('.adopter-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.adopter-card__name').textContent).toBe('Ana Pérez');
    expect(cards[0].querySelector('.adopter-card__phone').textContent).toBe('3001234567');
    expect(cards[0].getAttribute('href')).toBe('adopters.html?id=1');
    expect(cards[1].getAttribute('href')).toBe(adopterHref(2));
  });

  it('indica cuando un adoptante no tiene teléfono', () => {
    renderAdopterList(container, [{ id: 3, name: 'Sin Tel', phone: null }]);
    expect(container.querySelector('.adopter-card__phone').textContent).toBe('Sin teléfono');
  });

  it('inserta los datos como texto y no como HTML', () => {
    renderAdopterList(container, [{ id: 1, name: '<b>x</b>', phone: '1' }]);

    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.adopter-card__name').textContent).toBe('<b>x</b>');
  });

  it('reemplaza el contenido anterior', () => {
    renderAdopterList(container, []);
    renderAdopterList(container, [{ id: 1, name: 'Ana', phone: '1' }]);

    expect(container.querySelector('.state')).toBeNull();
    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelectorAll('.adopter-grid')).toHaveLength(1);
  });
});
