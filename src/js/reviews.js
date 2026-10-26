import { createReview, listReviews } from './api/reviewsApi.js';
import { renderHeader } from './components/header.js';
import { renderReviewForm } from './components/reviewForm.js';
import { renderReviewList } from './components/reviewList.js';
import { renderEmpty, renderError, renderLoading } from './components/stateViews.js';
import { clear, el, getQueryParam } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

/**
 * Punto de entrada de la página de reseñas (`reviews.html?adoption=<id>`).
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header);

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const adoptionId = getQueryParam('adoption', search);
  if (!/^\d+$/.test(String(adoptionId))) {
    renderEmpty(app, {
      title: 'Falta la adopción',
      text: 'Abre esta página desde una adopción para ver y escribir reseñas.',
    });
    return Promise.resolve();
  }

  const formMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Reseñas de la adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Comparte tu experiencia y ayuda a otras personas a decidir con confianza.',
    ),
    el('div', { class: 'reviews-layout' }, formMount, listMount),
  );

  async function loadReviews() {
    renderLoading(listMount, 'Cargando reseñas…');
    try {
      renderReviewList(listMount, await listReviews(adoptionId));
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar las reseñas',
        text: friendlyMessage(error),
        onRetry: loadReviews,
      });
    }
  }

  renderReviewForm(formMount, {
    onSubmit: async (review) => {
      await createReview(adoptionId, review);
      await loadReviews();
    },
  });

  return loadReviews();
}

init();
