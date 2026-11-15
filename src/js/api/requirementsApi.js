import { request } from './httpClient.js';

/** Requerimientos para adoptar una mascota. */
export function listRequirements(options = {}) {
  return request('/adoption-requirements', options);
}
