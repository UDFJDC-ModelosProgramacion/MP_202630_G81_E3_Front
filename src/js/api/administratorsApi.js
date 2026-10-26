import { request } from './httpClient.js';

const BASE_PATH = '/administrators';

export function listAdministrators(options) {
  return request(BASE_PATH, options);
}

export function createAdministrator(administrator, options) {
  return request(BASE_PATH, { ...options, method: 'POST', body: administrator });
}

export function deleteAdministrator(administratorId, options) {
  return request(`${BASE_PATH}/${administratorId}`, { ...options, method: 'DELETE' });
}

export function associateShelter(administratorId, shelterId, options) {
  return request(`${BASE_PATH}/${administratorId}/shelters/${shelterId}`, {
    ...options,
    method: 'POST',
  });
}
