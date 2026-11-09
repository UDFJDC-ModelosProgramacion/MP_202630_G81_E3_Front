import { getNotification, listNotifications } from './api/notificationsApi.js';
import { renderHeader } from './components/header.js';
import { renderNotificationDetail } from './components/notificationDetail.js';
import { renderNotificationList } from './components/notificationList.js';
import { renderEmpty, renderError, renderLoading } from './components/stateViews.js';
import { clear, el, getQueryParam } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

const isId = (value) => /^\d+$/.test(String(value));

async function showList(app, shelterId) {
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Notificaciones'),
    el('p', { class: 'page-lead' }, 'Novedades del refugio sobre tu proceso de adopción.'),
    listMount,
  );

  async function load() {
    renderLoading(listMount, 'Cargando notificaciones…');
    try {
      renderNotificationList(listMount, shelterId, await listNotifications(shelterId));
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar las notificaciones',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

async function showDetail(app, shelterId, notificationId) {
  async function load() {
    renderLoading(app, 'Cargando notificación…');
    try {
      renderNotificationDetail(app, shelterId, await getNotification(shelterId, notificationId));
    } catch (error) {
      if (error.status === 404) {
        renderEmpty(app, { title: 'Notificación no encontrada' });
        return;
      }
      renderError(app, {
        title: 'No pudimos cargar la notificación',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

/**
 * Página de notificaciones del refugio.
 * `notifications.html?shelter=<id>` muestra el listado y
 * `notifications.html?shelter=<id>&notification=<id>` muestra el detalle.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header);

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const shelterId = getQueryParam('shelter', search);
  if (!isId(shelterId)) {
    renderEmpty(app, {
      title: 'Falta el refugio',
      text: 'Abre esta página desde un refugio para ver sus notificaciones.',
    });
    return Promise.resolve();
  }

  const notificationId = getQueryParam('notification', search);
  if (notificationId === null) return showList(app, shelterId);
  if (!isId(notificationId)) {
    renderEmpty(app, { title: 'Notificación no encontrada' });
    return Promise.resolve();
  }
  return showDetail(app, shelterId, notificationId);
}

init();
