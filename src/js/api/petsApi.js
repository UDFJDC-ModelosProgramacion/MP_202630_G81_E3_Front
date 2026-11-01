import { request } from './httpClient.js';

export function getAvailablePets({ activityLevel, spaceRequirement } = {}, options) {
  return request('/pets/available', { ...options, params: { activityLevel, spaceRequirement } });
}
