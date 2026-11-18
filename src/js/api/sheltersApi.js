import { request } from './httpClient.js';

const SHELTERS_PATH = '/shelters';

/** Refugios registrados; con `city` el back devuelve solo los de esa ciudad (coincidencia exacta). */
export function listShelters({ city } = {}, options = {}) {
  return request(SHELTERS_PATH, { ...options, params: { city } });
}

/** Registra un refugio: `{ name, city, photos[], videos[] }`. */
export function createShelter(shelter, options = {}) {
  return request(SHELTERS_PATH, { ...options, method: 'POST', body: shelter });
}

/** Un refugio con sus mascotas, veterinarios, eventos y administradores. */
export function getShelter(shelterId, options = {}) {
  return request(`${SHELTERS_PATH}/${encodeURIComponent(shelterId)}`, options);
}

/** Registra un refugio (`name` y `city`). El back responde 412 si falta un dato o ya existe. */
export function createShelter({ name, city }, options = {}) {
  return request(SHELTERS_PATH, { ...options, method: 'POST', body: { name, city } });
}