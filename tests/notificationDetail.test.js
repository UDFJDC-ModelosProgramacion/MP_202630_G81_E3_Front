import { beforeEach, describe, expect, it } from 'vitest';
import {
  READ_ONLY_NOTE,
  renderNotificationDetail,
} from '../src/js/components/notificationDetail.js';

describe('renderNotificationDetail', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
    renderNotificationDetail(container, 3, {
      id: 7,
      content: 'Tu solicitud fue aprobada',
      date: '2026-11-08',
    });
  });

  it('muestra el contenido y la fecha', () => {
    expect(container.querySelector('.notification-detail__content').textContent).toBe(
      'Tu solicitud fue aprobada',
    );
    expect(container.querySelector('.notification-detail__date').textContent).toBe('08/11/2026');
  });

  it('enlaza de vuelta al listado del mismo refugio', () => {
    expect(container.querySelector('.back-link').getAttribute('href')).toBe(
      'notifications.html?shelter=3',
    );
  });

  it('informa que es un registro histórico y no ofrece editar', () => {
    expect(container.querySelector('.notification-detail__note').textContent).toBe(READ_ONLY_NOTE);
    expect(container.querySelector('form, input, textarea, button')).toBeNull();
  });

  it('inserta el contenido como texto y no como HTML', () => {
    renderNotificationDetail(container, 3, { id: 1, content: '<img src=x>', date: null });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.notification-detail__date').textContent).toBe('Sin fecha');
  });
});
