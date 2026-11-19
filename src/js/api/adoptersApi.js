import { request } from './httpClient.js';

const adopterPath = (id) => `/adopters/${encodeURIComponent(id)}`;

/** Lista de adoptantes  */
export function listAdopters(options = {}) {
  return request('/adopters', options);
}

/** Un adoptante con sus adopciones  */
export function getAdopter(id, options = {}) {
  return request(adopterPath(id), options);
}

/** Actualiza los datos de un adoptante  */
export function updateAdopter(id, adopter, options = {}) {
  return request(adopterPath(id), { ...options, method: 'PUT', body: adopter });
}

/** Elimina un adoptante */
export function deleteAdopter(id, options = {}) {
  return request(adopterPath(id), { ...options, method: 'DELETE' });
}
