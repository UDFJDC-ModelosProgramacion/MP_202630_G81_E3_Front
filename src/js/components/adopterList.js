import { el, clear } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

/** Enlace al perfil de un adoptante. */
export const adopterHref = (id) => `adopters.html?id=${encodeURIComponent(id)}`;

function adopterCard(adopter) {
  return el(
    'li',
    {},
    el(
      'a',
      { class: 'adopter-card', href: adopterHref(adopter.id) },
      el('h2', { class: 'adopter-card__name' }, adopter.name),
      el('p', { class: 'adopter-card__phone' }, adopter.phone || 'Sin teléfono'),
    ),
  );
}

/** Pinta los adoptantes como tarjetas (nombre y teléfono) o el estado vacío. */
export function renderAdopterList(container, adopters) {
  if (adopters.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay adoptantes',
      text: 'Cuando se registre un adoptante aparecerá aquí.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(el('ul', { class: 'adopter-grid' }, ...adopters.map(adopterCard)));
}
