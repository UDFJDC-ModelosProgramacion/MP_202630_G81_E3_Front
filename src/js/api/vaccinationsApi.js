import { request } from './httpClient.js';

const basePath = (petId) => `/pets/${encodeURIComponent(petId)}/vaccinations`;

/** Carné de vacunación de una mascota; con `upcoming` solo las próximas dosis. */
export function listVaccinations(petId, { upcoming = false } = {}, options = {}) {
  return request(basePath(petId), { ...options, params: { upcoming: upcoming || undefined } });
}

/** Registra una vacuna (`name`, `applicationDate`, `nextDueDate`, `notes`). */
export function createVaccination(petId, vaccination, options = {}) {
  return request(basePath(petId), { ...options, method: 'POST', body: vaccination });
}

export function deleteVaccination(petId, vaccinationId, options = {}) {
  return request(`${basePath(petId)}/${encodeURIComponent(vaccinationId)}`, {
    ...options,
    method: 'DELETE',
  });
}
