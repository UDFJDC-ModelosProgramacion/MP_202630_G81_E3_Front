import { petNameOf } from '../domain/followUps.js';
import { clear, el } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';
import { petPhoto, speciesLabel } from '../utils/petImage.js';
import { renderEmpty } from './stateViews.js';

export const followUpHref = (adopterId, adoptionId) =>
  `follow-ups.html?adopter=${encodeURIComponent(adopterId)}` +
  `&adoption=${encodeURIComponent(adoptionId)}`;

function adoptionCard(adopterId, adoption) {
  return el(
    'div',
    { class: 'col' },
    el(
      'a',
      {
        class: 'card h-100 shadow-sm text-decoration-none text-reset',
        href: followUpHref(adopterId, adoption.id),
      },
      el(
        'div',
        { class: 'card-body' },
        el('img', { class: 'card-pet-photo', src: petPhoto(adoption.pet), alt: '' }),
        el('h2', { class: 'h5 card-title' }, petNameOf(adoption)),
        adoption.pet?.species
          ? el('p', { class: 'pet-card__species' }, speciesLabel(adoption.pet.species))
          : null,
        el(
          'p',
          { class: 'text-body-secondary mb-2' },
          `Adoptada el ${formatDate(adoption.adoptionDate)}`,
        ),
        el('span', { class: 'badge text-bg-secondary' }, 'Registrar seguimiento'),
      ),
    ),
  );
}

export function renderFollowUpAdoptionList(container, adopterId, adoptions) {
  if (adoptions.length === 0) {
    renderEmpty(container, {
      title: 'Aún no tienes adopciones para seguimiento',
      text: 'Cuando adoptes una mascota podrás registrar aquí su adaptación.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3' },
      ...adoptions.map((adoption) => adoptionCard(adopterId, adoption)),
    ),
  );
}
