import { request } from './httpClient.js';

const shelterVeterinariansPath = (shelterId) =>
  `/shelters/${encodeURIComponent(shelterId)}/veterinarians`;

/** Veterinarios de un refugio (`id`, `name`, `speciality`). */
export function listShelterVeterinarians(shelterId, options) {
  return request(shelterVeterinariansPath(shelterId), options);
}

/** Registra un veterinario (`name`, `speciality`, `email`, `phone`, `availability`) en el refugio. */
export function createVeterinarian(shelterId, veterinarian, options) {
  return request(shelterVeterinariansPath(shelterId), {
    ...options,
    method: 'POST',
    body: veterinarian,
  });
}
