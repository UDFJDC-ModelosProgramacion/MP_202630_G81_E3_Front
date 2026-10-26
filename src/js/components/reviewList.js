import { el, clear } from '../utils/dom.js';
import { MAX_SCORE } from './reviewForm.js';
import { renderEmpty } from './stateViews.js';

/** Convierte la calificación del back (texto) en un entero de 0 a MAX_SCORE. */
export function toStars(score) {
  const value = Math.round(Number(score));
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_SCORE) : 0;
}

function reviewCard(review) {
  const stars = toStars(review.score);
  return el(
    'li',
    { class: 'review-card' },
    el(
      'span',
      {
        class: 'review-card__score',
        role: 'img',
        'aria-label': `Calificación: ${stars} de ${MAX_SCORE}`,
      },
      '★'.repeat(stars) + '☆'.repeat(MAX_SCORE - stars),
    ),
    el('p', { class: 'review-card__comment' }, review.comments),
  );
}

/** Pinta la lista de reseñas o el estado vacío si no hay ninguna. */
export function renderReviewList(container, reviews) {
  if (reviews.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay reseñas',
      text: 'Sé la primera persona en compartir su experiencia.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(el('ul', { class: 'review-list' }, ...reviews.map(reviewCard)));
}
