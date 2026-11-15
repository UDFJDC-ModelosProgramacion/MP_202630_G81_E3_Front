import { request } from './httpClient.js';

const adopterPath = (id) => `/adopters/${encodeURIComponent(id)}`;

/** Lista de adoptantes (AdopterDTO: id, name, phone). */
export function listAdopters(options = {}) {
  return request('/adopters', options);
}

/** Un adoptante con sus adopciones (AdopterDetailDTO: id, name, phone, adoptions[]). */
export function getAdopter(id, options = {}) {
  return request(adopterPath(id), options);
}

/** Elimina un adoptante; el back responde 204 sin cuerpo. */
export function deleteAdopter(id, options = {}) {
  return request(adopterPath(id), { ...options, method: 'DELETE' });
}
