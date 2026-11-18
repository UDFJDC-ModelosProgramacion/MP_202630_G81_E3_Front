import { beforeEach, describe, expect, it } from 'vitest';
import {
  NO_DEVOLUTIONS_TITLE,
  devolutionHref,
  renderDevolutionHistoryList,
} from '../src/js/components/devolutionHistoryList.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('renderDevolutionHistoryList', () => {
  let container;

  const DEVOLUTIONS = [
    {
      id: 1,
      date: '2026-09-01',
      reason: 'Alergias',
      adoption: { id: 7, pet: { name: 'Luna' }, adopter: { name: 'Ana' } },
    },
    {
      id: 2,
      date: '2026-10-15',
      reason: 'Cambio de ciudad',
      adoption: { id: 8, pet: { name: 'Rocky' }, adopter: { name: 'Luis' } },
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('sin devoluciones muestra el estado vacío', () => {
    renderDevolutionHistoryList(container, []);

    expect(container.querySelector('.state__title').textContent).toBe(NO_DEVOLUTIONS_TITLE);
    expect(container.querySelector('table')).toBeNull();
  });

  it('muestra fecha, mascota, adoptante y motivo, la más reciente primero', () => {
    renderDevolutionHistoryList(container, DEVOLUTIONS);

    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('time').textContent).toBe('15 de octubre de 2026');
    expect(rows[0].querySelector('th').textContent).toBe('Rocky');
    expect(rows[0].textContent).toContain('Luis');
    expect(rows[0].textContent).toContain('Cambio de ciudad');
    expect(rows[1].querySelector('th').textContent).toBe('Luna');
  });

  it('enlaza cada devolución con el detalle de su adopción', () => {
    renderDevolutionHistoryList(container, DEVOLUTIONS);

    const href = container.querySelector('tbody a').getAttribute('href');
    expect(href).toBe('devolution.html?adoption=8');
    expect(href).toBe(devolutionHref(8));
  });

  it('omite el enlace si el back no envía la adopción', () => {
    renderDevolutionHistoryList(container, [{ id: 1, date: '2026-09-01', reason: 'x' }]);

    expect(container.querySelector('tbody a')).toBeNull();
    expect(container.querySelector('tbody th').textContent).toBe('Mascota sin nombre');
  });

  it('inserta el motivo como texto y no como HTML', () => {
    renderDevolutionHistoryList(container, [
      { id: 1, date: '2026-09-01', reason: '<img src=x onerror=alert(1)>' },
    ]);

    expect(container.querySelector('img')).toBeNull();
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderDevolutionHistoryList(container, DEVOLUTIONS);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
  });
});