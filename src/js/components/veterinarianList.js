import { el, clear } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

const shelterLabel = (shelter) => `${shelter.name} · ${shelter.city}`;

export const veterinarianHistoryHref = (veterinarianId) =>
  `medical-history.html?veterinarian=${encodeURIComponent(veterinarianId)}`;

function buildVeterinarian(veterinarian) {
  return el(
    'li',
    { class: 'list-group-item d-flex justify-content-between align-items-center gap-3' },
    el(
      'div',
      {},
      el('div', { class: 'fw-bold' }, veterinarian.name),
      el('div', { class: 'small text-body-secondary' }, veterinarian.speciality),
      veterinarian.availability
        ? el('div', { class: 'small' }, `Disponibilidad: ${veterinarian.availability}`)
        : null,
      veterinarian.phone || veterinarian.email
        ? el(
            'div',
            { class: 'small' },
            [veterinarian.phone, veterinarian.email].filter(Boolean).join(' · '),
          )
        : null,
    ),
    el(
      'a',
      {
        class: 'btn btn-outline-primary btn-sm',
        href: veterinarianHistoryHref(veterinarian.id),
      },
      'Historial médico',
    ),
  );
}

function buildShelter(shelter) {
  const veterinarians = shelter.veterinarians ?? [];
  const body = veterinarians.length
    ? el('ul', { class: 'list-group list-group-flush' }, ...veterinarians.map(buildVeterinarian))
    : el(
        'p',
        { class: 'card-body text-body-secondary small mb-0' },
        'Este refugio aún no tiene veterinarios.',
      );
  return el(
    'article',
    { class: 'card mb-3' },
    el(
      'div',
      { class: 'card-header d-flex justify-content-between align-items-center' },
      el('h3', { class: 'h6 mb-0' }, shelterLabel(shelter)),
      el('span', { class: 'badge text-bg-secondary' }, String(veterinarians.length)),
    ),
    body,
  );
}

export function renderVeterinarianList(mount, { shelters }) {
  if (shelters.length === 0) {
    renderEmpty(mount, {
      title: 'Aún no hay refugios',
      text: 'Registra un refugio para poder agregar veterinarios.',
    });
    return;
  }
  mount.setAttribute('aria-busy', 'false');
  clear(mount).append(...shelters.map(buildShelter));
}
