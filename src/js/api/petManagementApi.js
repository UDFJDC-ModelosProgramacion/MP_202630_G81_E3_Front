import { request } from './httpClient.js';

const PETS_PATH = '/pets';
const petPath = (petId) => `${PETS_PATH}/${encodeURIComponent(petId)}`;

/** Todas las mascotas registradas (PetDetailDTO: datos, refugio, eventos y raza). */
export function listPets(options = {}) {
  return request(PETS_PATH, options);
}

/** Una mascota por su id. */
export function getPet(petId, options = {}) {
  return request(petPath(petId), options);
}

/** Registra una mascota (con un único evento ARRIVAL) y devuelve la creada. */
export function createPet(pet, options = {}) {
  return request(PETS_PATH, { ...options, method: 'POST', body: pet });
}

/** Actualiza una mascota (el back reemplaza todos sus datos) y devuelve la versión guardada. */
export function updatePet(petId, pet, options = {}) {
  return request(petPath(petId), { ...options, method: 'PUT', body: pet });
}
