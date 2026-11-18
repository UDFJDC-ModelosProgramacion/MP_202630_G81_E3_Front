import * as reviewsApi from '../api/reviewsApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { field, replaceContent, tag } from '../utils/ui.js';

export const stars = (score) => {
  const value = Math.max(0, Math.min(5, Number(score) || 0));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
};

/** Reseñas de adoptantes e historias de éxito de mascotas ya adoptadas. */
export async function renderSuccessStoriesPage(mount, { api = reviewsApi } = {}) {
  const filter = field({
    label: 'Mostrar',
    name: 'filter',
    options: [
      { value: '', label: 'Todas las reseñas' },
      { value: 'true', label: 'Solo historias de éxito' },
    ],
  });
  const results = el('div', { 'aria-live': 'polite' });

  async function load() {
    renderLoading(results, 'Cargando reseñas…');
    try {
      const reviews =
        (await api.listAllReviews({ successStory: filter.control.value || undefined })) ?? [];
      if (!reviews.length) {
        renderEmpty(results, {
          title: 'Aún no hay reseñas',
          text: 'Cuando los adoptantes compartan su experiencia aparecerá aquí.',
        });
        return;
      }
      results.setAttribute('aria-busy', 'false');
      replaceContent(
        results,
        el(
          'ul',
          { class: 'fx-list' },
          ...reviews.map((review) =>
            el(
              'li',
              { class: 'fx-item' },
              el(
                'div',
                {},
                el(
                  'p',
                  { class: 'fx-item__title' },
                  `${review.petName ?? 'Mascota'} · adoptada por ${review.adopterName ?? 'un adoptante'}`,
                ),
                el(
                  'p',
                  { class: 'fx-item__meta', 'aria-label': `Calificación ${review.score} de 5` },
                  stars(review.score),
                ),
                el('p', {}, review.comments),
              ),
              review.successStory ? tag('Historia de éxito', 'success') : null,
            ),
          ),
        ),
      );
    } catch (error) {
      renderError(results, {
        title: 'No pudimos cargar las reseñas',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'COMUNIDAD'),
    el('h1', { class: 'page-title' }, 'Reseñas e historias de éxito'),
    el('p', { class: 'page-lead' }, 'Conoce la experiencia de quienes ya adoptaron.'),
    el('div', { class: 'fx-toolbar' }, filter.root),
    results,
  );
  filter.control.addEventListener('change', load);
  return load();
}
