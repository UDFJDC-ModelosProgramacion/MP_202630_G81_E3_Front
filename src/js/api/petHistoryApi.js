import { request } from './httpClient.js';

/** Historial completo: eventos, adopciones y devoluciones de la mascota. */
export function getPetHistory(petId, options = {}) {
  return request(`/pets/${encodeURIComponent(petId)}/history`, options);
}
