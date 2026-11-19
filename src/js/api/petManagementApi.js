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

/** Agrega una foto (enlace http/https) al perfil de la mascota. */
export function addPetPhoto(petId, url, options = {}) {
  return request(`${petPath(petId)}/photos`, { ...options, method: 'POST', body: { url } });
}

/**
 * Sube un archivo de imagen (multipart, campo `file`) y devuelve su enlace público (cadena).
 * Requiere el endpoint `POST /pets/images` → `{ url }` en el back.
 */
export async function uploadPetImage(file, options = {}) {
  const body = new FormData();
  body.append('file', file);
  const uploaded = await request(`${PETS_PATH}/images`, { ...options, method: 'POST', body });
  return uploaded?.url;
}

/** Actualiza una mascota (el back reemplaza todos sus datos) y devuelve la versión guardada. */
export function updatePet(petId, pet, options = {}) {
  return request(petPath(petId), { ...options, method: 'PUT', body: pet });
}
