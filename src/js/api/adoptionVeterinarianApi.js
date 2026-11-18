import { request } from './httpClient.js';

const adoptionVeterinarianPath = (adoptionId) =>
  `/adoptions/${encodeURIComponent(adoptionId)}/veterinarian`;

/** Asigna el veterinario a la adopción (el back valida refugio, estado y disponibilidad). */
export function assignVeterinarian(adoptionId, veterinarianId, options) {
  return request(`${adoptionVeterinarianPath(adoptionId)}/${encodeURIComponent(veterinarianId)}`, {
    ...options,
    method: 'POST',
  });
}

/** Quita el veterinario de la adopción; queda disponible para otras. */
export function removeVeterinarian(adoptionId, options) {
  return request(adoptionVeterinarianPath(adoptionId), { ...options, method: 'DELETE' });
}
