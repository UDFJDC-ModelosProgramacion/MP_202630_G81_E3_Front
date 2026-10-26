import { request } from './httpClient.js';

const reviewsPath = (adoptionId) => `/adoptions/${encodeURIComponent(adoptionId)}/reviews`;

/** Reseñas de una adopción. */
export function listReviews(adoptionId, options = {}) {
  return request(reviewsPath(adoptionId), options);
}

/** Crea una reseña. El back guarda la calificación como texto, por eso se envía como String. */
export function createReview(adoptionId, { comments, score }, options = {}) {
  return request(reviewsPath(adoptionId), {
    ...options,
    method: 'POST',
    body: { comments, score: String(score) },
  });
}
