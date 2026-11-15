import { request } from './httpClient.js';

const followUpsPath = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}/follow-ups`;

/**
 * Seguimientos de una adopción. Se envía el adoptante para que el back verifique que la
 * adopción le pertenece (responde 403 si no).
 */
export function listFollowUps(adoptionId, adopterId, options = {}) {
  return request(followUpsPath(adoptionId), { ...options, params: { adopterId } });
}

/** Registra un seguimiento (`date` yyyy-mm-dd, `adaptationStatus` y `observations`). */
export function createFollowUp(
  adoptionId,
  adopterId,
  { date, adaptationStatus, observations },
  options = {},
) {
  return request(followUpsPath(adoptionId), {
    ...options,
    method: 'POST',
    params: { adopterId },
    body: { date, adaptationStatus, observations },
  });
}
