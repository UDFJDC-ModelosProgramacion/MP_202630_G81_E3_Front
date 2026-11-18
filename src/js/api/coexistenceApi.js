import { request } from './httpClient.js';

const path = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}/coexistence-test`;

/** Convivencia de prueba de una adopción (404 si aún no se ha iniciado). */
export function getCoexistenceTest(adoptionId, options = {}) {
  return request(path(adoptionId), options);
}

/** Inicia la convivencia: `startDate`, `endDate` y `result` (IN_PROGRESS por defecto). */
export function createCoexistenceTest(adoptionId, test, options = {}) {
  return request(path(adoptionId), { ...options, method: 'POST', body: test });
}

export function updateCoexistenceTest(adoptionId, test, options = {}) {
  return request(path(adoptionId), { ...options, method: 'PUT', body: test });
}

export function deleteCoexistenceTest(adoptionId, options = {}) {
  return request(path(adoptionId), { ...options, method: 'DELETE' });
}
