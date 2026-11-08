import { request } from './httpClient.js';

/** GET /pets/{petId}/breed → raza de la mascota; el back responde 404 si no tiene raza. */
export function getPetBreed(petId, options) {
  return request(`/pets/${encodeURIComponent(petId)}/breed`, options);
}
