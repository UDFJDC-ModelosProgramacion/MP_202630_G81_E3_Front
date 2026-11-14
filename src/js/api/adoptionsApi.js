import { request } from './httpClient.js';

/** Una adopción (AdoptionDetailDTO: id, adoptionDate, status, ...). El back responde 404 si no existe. */
export function getAdoption(adoptionId, options = {}) {
  return request(`/adoptions/${encodeURIComponent(adoptionId)}`, options);
}
