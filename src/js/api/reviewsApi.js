import { request } from './httpClient.js';

const reviewsPath = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}/reviews`;

/** Reseñas de una adopción. */
export function listReviews(adoptionId, options = {}) {
  return request(reviewsPath(adoptionId), options);
}

/** Crea una reseña. El back guarda la calificación como texto, por eso se envía como String. */
export function createReview(adoptionId, { comments, score, successStory = false }, options = {}) {
  return request(reviewsPath(adoptionId), {
    ...options,
    method: 'POST',
    body: { comments, score: String(score), successStory: successStory === true },
  });
}

/** Reseñas públicas de todos los adoptantes; con `successStory` solo las historias de éxito. */
export function listAllReviews({ successStory } = {}, options = {}) {
  return request('/reviews', { ...options, params: { successStory } });
}
