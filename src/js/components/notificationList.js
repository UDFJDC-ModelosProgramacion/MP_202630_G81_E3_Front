import { el, clear } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

export const NO_NOTIFICATIONS_MESSAGE = 'No tienes notificaciones';

const timestamp = (value) => (value === null || value === undefined ? NaN : new Date(value).getTime());

/**
 * Formatea la fecha como dd/mm/aaaa. El back guarda solo la fecha (java.util.Date con
 * TemporalType.DATE), por eso se lee en UTC para que no se corra un día según la zona horaria.
 */
export function formatDate(value) {
  const time = timestamp(value);
  if (Number.isNaN(time)) return 'Sin fecha';
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Copia ordenada de la más reciente a la más antigua; las notificaciones sin fecha van al final. */
export function sortByDateDesc(notifications) {
  return [...notifications].sort((a, b) => {
    const left = timestamp(a.date);
    const right = timestamp(b.date);
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
}

/** Enlace al listado de un refugio. */
export const listHref = (shelterId) => `notifications.html?shelter=${encodeURIComponent(shelterId)}`;

/** Enlace al detalle de una notificación. */
export const notificationHref = (shelterId, notificationId) =>
  `notifications.html?shelter=${encodeURIComponent(shelterId)}&notification=${encodeURIComponent(notificationId)}`;

function notificationItem(shelterId, notification) {
  return el(
    'li',
    {},
    el(
      'a',
      { class: 'notification-card', href: notificationHref(shelterId, notification.id) },
      el('p', { class: 'notification-card__content' }, notification.content),
      el('p', { class: 'notification-card__date' }, formatDate(notification.date)),
    ),
  );
}

/** Pinta las notificaciones de la más reciente a la más antigua, o el estado vacío. */
export function renderNotificationList(container, shelterId, notifications) {
  if (notifications.length === 0) {
    renderEmpty(container, { title: NO_NOTIFICATIONS_MESSAGE });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'ul',
      { class: 'notification-list' },
      ...sortByDateDesc(notifications).map((item) => notificationItem(shelterId, item)),
    ),
  );
}
