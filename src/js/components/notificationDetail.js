import { el, clear } from '../utils/dom.js';
import { formatDate, listHref } from './notificationList.js';

export const READ_ONLY_NOTE =
  'Las notificaciones son un registro histórico y no se pueden editar.';

/** Pinta el detalle de una notificación. No incluye ninguna acción de edición. */
export function renderNotificationDetail(container, shelterId, notification) {
  clear(container).append(
    el(
      'article',
      { class: 'notification-detail', 'aria-labelledby': 'notification-title' },
      el('a', { class: 'back-link', href: listHref(shelterId) }, '← Volver a las notificaciones'),
      el('h1', { class: 'page-title', id: 'notification-title' }, 'Detalle de la notificación'),
      el('p', { class: 'notification-detail__date' }, formatDate(notification.date)),
      el('p', { class: 'notification-detail__content' }, notification.content),
      el('p', { class: 'notification-detail__note' }, READ_ONLY_NOTE),
    ),
  );
}
