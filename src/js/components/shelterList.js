import { petCountLabel, petCountOf } from '../domain/shelters.js';
import { clear, el } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

/** Enlace al detalle de un refugio. */
export const shelterHref = (id) => `shelters.html?id=${encodeURIComponent(id)}`;

function shelterCard(shelter) {
  return el(
    'div',
    { class: 'col' },
    el(
      'a',
      {
        class: 'card h-100 shadow-sm text-decoration-none text-reset',
        href: shelterHref(shelter.id),
      },
      el(
        'div',
        { class: 'card-body' },
        el('h2', { class: 'h5 card-title' }, shelter.name),
        el('p', { class: 'text-body-secondary mb-2' }, shelter.city),
        el('span', { class: 'badge text-bg-secondary' }, petCountLabel(petCountOf(shelter))),
      ),
    ),
  );
}

function renderNoResults(container, city, onShowAll) {
  if (!city) {
    renderEmpty(container, {
      title: 'Aún no hay refugios',
      text: 'Cuando se registre un refugio aparecerá aquí.',
    });
    return;
  }
  renderEmpty(container, {
    title: `No hay refugios en ${city}`,
    text: 'No hay refugios registrados en esa ciudad.',
    actionLabel: 'Ver todos los refugios',
    onAction: onShowAll,
  });
}

/**
 * Pinta los refugios como tarjetas (nombre, ciudad y número de mascotas).
 * Si no hay resultados muestra el estado vacío; con ciudad ofrece volver a ver todos.
 */
export function renderShelterList(container, shelters, { city = '', onShowAll } = {}) {
  if (shelters.length === 0) {
    renderNoResults(container, city, onShowAll);
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3' },
      ...shelters.map(shelterCard),
    ),
  );
}
