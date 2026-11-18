import { request } from './httpClient.js';

/** Reporte del refugio; `from` y `to` (yyyy-mm-dd) acotan el periodo y son opcionales. */
export function getShelterReport(shelterId, { from, to } = {}, options = {}) {
  return request(`/shelters/${encodeURIComponent(shelterId)}/reports`, {
    ...options,
    params: { from, to },
  });
}
