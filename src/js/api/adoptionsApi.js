import { request } from './httpClient.js';

const adoptionPath = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}`;

/** Detalle de una adopción: fecha, estado, contrato y requisitos asociados. */
export function getAdoption(adoptionId, options = {}) {
  return request(adoptionPath(adoptionId), options);
}

/** Todas las adopciones (solicitudes incluidas), con su mascota, adoptante y veterinario. */
export function listAdoptions(options = {}) {
  return request('/adoptions', options);
}

/** Registra una solicitud de adopción: `{ adoptionDate, adopter: { id }, pet: { id } }`. */
export function createAdoption(adoption, options = {}) {
  return request('/adoptions', { ...options, method: 'POST', body: adoption });
}

/** Cambia el estado de una adopción (el back exige también `adoptionDate`). */
export function updateAdoptionStatus(adoptionId, { adoptionDate, status }, options = {}) {
  return request(adoptionPath(adoptionId), {
    ...options,
    method: 'PUT',
    body: { adoptionDate, status },
  });
}

/** Asigna al veterinario responsable del seguimiento posadopción. */
export function assignVeterinarian(adoptionId, veterinarianId, options = {}) {
  return request(`${adoptionPath(adoptionId)}/veterinarian/${encodeURIComponent(veterinarianId)}`, {
    ...options,
    method: 'PUT',
  });
}
