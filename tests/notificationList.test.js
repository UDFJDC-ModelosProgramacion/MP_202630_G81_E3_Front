import { beforeEach, describe, expect, it } from 'vitest';
import {
  NO_NOTIFICATIONS_MESSAGE,
  formatDate,
  listHref,
  notificationHref,
  renderNotificationList,
  sortByDateDesc,
} from '../src/js/components/notificationList.js';

describe('formatDate', () => {
  it.each([
    ['2026-11-08', '08/11/2026'],
    ['2026-11-08T00:00:00.000+00:00', '08/11/2026'],
    [Date.UTC(2026, 0, 5), '05/01/2026'],
    ['no es fecha', 'Sin fecha'],
    [null, 'Sin fecha'],
    [undefined, 'Sin fecha'],
  ])('%s → %s', (value, expected) => {
    expect(formatDate(value)).toBe(expected);
  });
});

describe('sortByDateDesc', () => {
  it('ordena de la más reciente a la más antigua sin modificar el original', () => {
    const original = [
      { id: 1, date: '2026-01-01' },
      { id: 2, date: '2026-03-01' },
      { id: 3, date: '2026-02-01' },
    ];

    expect(sortByDateDesc(original).map((n) => n.id)).toEqual([2, 3, 1]);
    expect(original.map((n) => n.id)).toEqual([1, 2, 3]);
  });

  it('deja al final las notificaciones sin fecha válida', () => {
    const sorted = sortByDateDesc([
      { id: 1, date: null },
      { id: 2, date: '2026-01-01' },
      { id: 3, date: 'x' },
      { id: 4, date: '2026-05-01' },
    ]);

    expect(sorted.map((n) => n.id)).toEqual([4, 2, 1, 3]);
  });
});

describe('renderNotificationList', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('sin notificaciones muestra “No tienes notificaciones”', () => {
    renderNotificationList(container, 3, []);

    expect(container.querySelector('.state__title').textContent).toBe(NO_NOTIFICATIONS_MESSAGE);
    expect(NO_NOTIFICATIONS_MESSAGE).toBe('No tienes notificaciones');
    expect(container.querySelector('.notification-card')).toBeNull();
  });

  it('muestra contenido y fecha, de la más reciente a la más antigua', () => {
    renderNotificationList(container, 3, [
      { id: 1, content: 'Antigua', date: '2026-01-10' },
      { id: 2, content: 'Reciente', date: '2026-03-05' },
    ]);

    const cards = container.querySelectorAll('.notification-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.notification-card__content').textContent).toBe('Reciente');
    expect(cards[0].querySelector('.notification-card__date').textContent).toBe('05/03/2026');
    expect(cards[1].querySelector('.notification-card__content').textContent).toBe('Antigua');
  });

  it('cada tarjeta enlaza al detalle de su notificación', () => {
    renderNotificationList(container, 3, [{ id: 9, content: 'x', date: '2026-01-10' }]);

    const href = container.querySelector('.notification-card').getAttribute('href');
    expect(href).toBe('notifications.html?shelter=3&notification=9');
    expect(href).toBe(notificationHref(3, 9));
    expect(listHref(3)).toBe('notifications.html?shelter=3');
  });

  it('inserta el contenido como texto y no como HTML', () => {
    renderNotificationList(container, 3, [{ id: 1, content: '<b>x</b>', date: '2026-01-10' }]);

    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.notification-card__content').textContent).toBe('<b>x</b>');
  });

  it('reemplaza el contenido anterior', () => {
    renderNotificationList(container, 3, []);
    renderNotificationList(container, 3, [{ id: 1, content: 'x', date: '2026-01-10' }]);

    expect(container.querySelector('.state')).toBeNull();
    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelectorAll('.notification-list')).toHaveLength(1);
  });
});
