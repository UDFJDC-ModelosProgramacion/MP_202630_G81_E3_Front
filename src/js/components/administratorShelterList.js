import { petCountLabel, petCountOf } from '../domain/shelters.js';
import { clear, el } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

export const NO_SHELTERS_TITLE = 'Aún no tienes refugios asignados';

export const administratorShelterHref = (administratorId, shelterId) =>
  `administrator-shelters.html?administrator=${encodeURIComponent(administratorId)}` +
  `&shelter=${encodeURIComponent(shelterId)}`;

function shelterCard(administratorId, shelter, onUnlink) {
  return el(
    'div',
    { class: 'col' },
    el(
      'article',
      { class: 'card h-100 shadow-sm' },
      el(
        'div',
        { class: 'card-body' },
        el(
          'h2',
          { class: 'h5 card-title' },
          el(
            'a',
            {
              class: 'stretched-link text-decoration-none',
              href: administratorShelterHref(administratorId, shelter.id),
            },
            shelter.name,
          ),
        ),
        el('p', { class: 'text-body-secondary mb-2' }, shelter.city),
        el('span', { class: 'badge text-bg-secondary' }, petCountLabel(petCountOf(shelter))),
      ),
      el(
        'div',
        { class: 'card-footer bg-transparent' },
        el(
          'button',
          {
            class: 'btn btn-outline-danger position-relative z-2',
            type: 'button',
            'aria-label': `Desvincular ${shelter.name}`,
            onClick: () => onUnlink(shelter),
          },
          'Desvincular',
        ),
      ),
    ),
  );
}

export function renderAdministratorShelterList(container, shelters, { administratorId, onUnlink }) {
  if (shelters.length === 0) {
    renderEmpty(container, {
      title: NO_SHELTERS_TITLE,
      text: 'Cuando te asocies a un refugio aparecerá aquí.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3' },
      ...shelters.map((shelter) => shelterCard(administratorId, shelter, onUnlink)),
    ),
  );
}
