import { request } from './httpClient.js';

const encode = encodeURIComponent;
const sheltersPath = (administratorId) => `/administrators/${encode(administratorId)}/shelters`;

export function listAdministratorShelters(administratorId, options = {}) {
  return request(sheltersPath(administratorId), options);
}

export function getAdministratorShelter(administratorId, shelterId, options = {}) {
  return request(`${sheltersPath(administratorId)}/${encode(shelterId)}`, options);
}

export function unlinkShelter(administratorId, shelterId, options = {}) {
  return request(`${sheltersPath(administratorId)}/${encode(shelterId)}`, {
    ...options,
    method: 'DELETE',
  });
}
