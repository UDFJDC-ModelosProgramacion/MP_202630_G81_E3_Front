import { request } from './httpClient.js';

/** Detalle de una adopción: fecha, estado, contrato y requisitos asociados. */
export function getAdoption(adoptionId, options = {}) {
  return request(`/adoptions/${encodeURIComponent(adoptionId)}`, options);
}
