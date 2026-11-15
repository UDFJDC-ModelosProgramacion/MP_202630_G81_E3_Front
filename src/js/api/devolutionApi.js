import { request } from './httpClient.js';

const devolutionPath = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}/devolution`;

/** Devolución de una adopción. El back responde 404 si la adopción no existe o no tiene devolución. */
export function getDevolution(adoptionId, options = {}) {
  return request(devolutionPath(adoptionId), options);
}

/** Registra la devolución (`date` yyyy-mm-dd y `reason`). El back responde 412 si hay una regla rota. */
export function createDevolution(adoptionId, { date, reason }, options = {}) {
  return request(devolutionPath(adoptionId), {
    ...options,
    method: 'POST',
    body: { date, reason },
  });
}
