import { request } from './httpClient.js';

const shelterVeterinariansPath = (shelterId) =>
  `/shelters/${encodeURIComponent(shelterId)}/veterinarians`;

/** Veterinarios de un refugio (`id`, `name`, `speciality`). */
export function listShelterVeterinarians(shelterId, options) {
  return request(shelterVeterinariansPath(shelterId), options);
}

/** Registra un veterinario (`name`, `speciality`) en el refugio indicado. */
export function createVeterinarian(shelterId, veterinarian, options) {
  return request(shelterVeterinariansPath(shelterId), {
    ...options,
    method: 'POST',
    body: veterinarian,
  });
}
