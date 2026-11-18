import { request } from './httpClient.js';

const path = (shelterId) => `/shelters/${encodeURIComponent(shelterId)}/messages`;

/** Mensajes de un refugio; con `petId` solo los de esa mascota. */
export function listMessages(shelterId, { petId } = {}, options = {}) {
  return request(path(shelterId), { ...options, params: { petId } });
}

/** Envía un mensaje: `{ content, senderName, senderRole: 'ADOPTER' | 'SHELTER', petId? }`. */
export function sendMessage(shelterId, message, options = {}) {
  return request(path(shelterId), { ...options, method: 'POST', body: message });
}
