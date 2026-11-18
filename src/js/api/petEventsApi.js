import { request } from './httpClient.js';

/** GET /pets/{petId}/events → eventos de la mascota (el back responde 404 si no existe). */
export function getPetEvents(petId, options) {
  return request(`/pets/${encodeURIComponent(petId)}/events`, options);
}

/** POST /pets/{petId}/events → registra un evento (`eventType`, `date`, `description`). */
export function createPetEvent(petId, event, options = {}) {
  return request(`/pets/${encodeURIComponent(petId)}/events`, {
    ...options,
    method: 'POST',
    body: event,
  });
}
