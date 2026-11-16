import { request } from './httpClient.js';

const encode = encodeURIComponent;
const sheltersPath = (administratorId) => `/administrators/${encode(administratorId)}/shelters`;

/** Refugios asociados al administrador. El back responde 404 si el administrador no existe. */
export function listAdministratorShelters(administratorId, options = {}) {
  return request(sheltersPath(administratorId), options);
}

/**
 * Un refugio del administrador. El back responde 412 si el refugio no está asociado
 * al administrador y 404 si alguno de los dos no existe.
 */
export function getAdministratorShelter(administratorId, shelterId, options = {}) {
  return request(`${sheltersPath(administratorId)}/${encode(shelterId)}`, options);
}

/** Desvincula al administrador del refugio (204 sin cuerpo). Responde 412 si no estaban asociados. */
export function unlinkShelter(administratorId, shelterId, options = {}) {
  return request(`${sheltersPath(administratorId)}/${encode(shelterId)}`, {
    ...options,
    method: 'DELETE',
  });
}
