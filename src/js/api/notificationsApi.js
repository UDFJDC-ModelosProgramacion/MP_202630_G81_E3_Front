import { request } from './httpClient.js';

const basePath = (shelterId) => `/shelters/${encodeURIComponent(shelterId)}/notifications`;

/** Notificaciones de un refugio (NotificationDTO: id, content, date). */
export function listNotifications(shelterId, options = {}) {
  return request(basePath(shelterId), options);
}

/** Una notificación del refugio. */
export function getNotification(shelterId, notificationId, options = {}) {
  return request(`${basePath(shelterId)}/${encodeURIComponent(notificationId)}`, options);
}
