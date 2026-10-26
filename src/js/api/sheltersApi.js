import { request } from './httpClient.js';

export function listShelters(options) {
  return request('/shelters', options);
}
