import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NO_SHELTERS_TITLE,
  administratorShelterHref,
  renderAdministratorShelterList,
} from '../src/js/components/administratorShelterList.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('renderAdministratorShelterList', () => {
  let container;
  let onUnlink;
  const shelters = [
    { id: 1, name: 'Huellitas', city: 'Bogotá', pets: [{ id: 1 }, { id: 2 }] },
    { id: 2, name: 'Patitas', city: 'Medellín' },
  ];

  function render(list = shelters) {
    renderAdministratorShelterList(container, list, { administratorId: 3, onUnlink });
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
    onUnlink = vi.fn();
  });

  it('pinta una tarjeta con nombre, ciudad y número de mascotas', () => {
    render();

    const cards = container.querySelectorAll('article.card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.card-title').textContent).toBe('Huellitas');
    expect(cards[0].textContent).toContain('Bogotá');
    expect(cards[0].querySelector('.badge').textContent).toBe('2 mascotas');
    expect(cards[1].querySelector('.badge').textContent).toBe('0 mascotas');
  });

  it('enlaza cada tarjeta a la información del refugio', () => {
    render();

    const href = container.querySelector('.card-title a').getAttribute('href');
    expect(href).toBe('administrator-shelters.html?administrator=3&shelter=1');
    expect(href).toBe(administratorShelterHref(3, 1));
  });

  it('delega la acción Desvincular con el refugio de la tarjeta', () => {
    render();

    container.querySelectorAll('button')[1].click();

    expect(onUnlink).toHaveBeenCalledWith(shelters[1]);
  });

  it('sin refugios avisa que aún no tiene refugios asignados', () => {
    render([]);

    expect(container.querySelector('.state__title').textContent).toBe(NO_SHELTERS_TITLE);
    expect(NO_SHELTERS_TITLE).toBe('Aún no tienes refugios asignados');
    expect(container.querySelector('button')).toBeNull();
  });

  it('inserta los datos como texto y no como HTML', () => {
    render([{ id: 1, name: '<b>x</b>', city: '<i>y</i>' }]);

    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.card-title').textContent).toBe('<b>x</b>');
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    render();

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
  });
});
