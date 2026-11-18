import { request } from './httpClient.js';

const path = (veterinarianId) => `/veterinarians/${encodeURIComponent(veterinarianId)}/adoptions`;

/** Adopciones asignadas al veterinario para el seguimiento posadopción. */
export function listAssignedAdoptions(veterinarianId, options = {}) {
  return request(path(veterinarianId), options);
}

/** Seguimientos de una adopción asignada (403 si no es suya). */
export function listAssignedFollowUps(veterinarianId, adoptionId, options = {}) {
  return request(`${path(veterinarianId)}/${encodeURIComponent(adoptionId)}/follow-ups`, options);
}

/** Eventos de la mascota de una adopción asignada (incluye lo que registra el adoptante). */
export function listAssignedPetEvents(veterinarianId, adoptionId, options = {}) {
  return request(`${path(veterinarianId)}/${encodeURIComponent(adoptionId)}/events`, options);
}
