import { request } from './httpClient.js';

const path = (shelterId) => `/shelters/${encodeURIComponent(shelterId)}/events`;

/** Calendario del refugio, del evento más próximo al más lejano. */
export function listShelterEvents(shelterId, options = {}) {
  return request(path(shelterId), options);
}

/** Crea un evento: `{ type, title, description, date }`. */
export function createShelterEvent(shelterId, event, options = {}) {
  return request(path(shelterId), { ...options, method: 'POST', body: event });
}

export function deleteShelterEvent(shelterId, eventId, options = {}) {
  return request(`${path(shelterId)}/${encodeURIComponent(eventId)}`, {
    ...options,
    method: 'DELETE',
  });
}
