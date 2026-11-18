import { request } from './httpClient.js';

export function getAvailablePets(
  { activityLevel, spaceRequirement, species, minAge, maxAge } = {},
  options,
) {
  return request('/pets/available', {
    ...options,
    params: { activityLevel, spaceRequirement, species, minAge, maxAge },
  });
}
