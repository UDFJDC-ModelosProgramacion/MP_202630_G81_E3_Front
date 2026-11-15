import { request } from './httpClient.js';

/** GET /pets/{petId}/events → eventos de la mascota (el back responde 404 si no existe). */
export function getPetEvents(petId, options) {
  return request(`/pets/${encodeURIComponent(petId)}/events`, options);
}
