import { isActiveAdoption, isAvailable } from '../domain/veterinarians.js';
import { clear, el } from '../utils/dom.js';
import { statusLabel } from './adoptionProcess.js';
import { availabilityBadge, personalData, veterinarianHistoryHref } from './veterinarianList.js';

function buildAdoptionCard(adoption) {
  return el(
    'section',
    { class: 'card mb-4', 'aria-labelledby': 'adoption-info-title' },
    el(
      'div',
      { class: 'card-body' },
      el('h2', { class: 'h5 card-title mb-3', id: 'adoption-info-title' }, 'Adopción'),
      el(
        'dl',
        { class: 'row mb-0' },
        el('dt', { class: 'col-sm-4' }, 'Mascota'),
        el('dd', { class: 'col-sm-8' }, adoption.pet?.name ?? 'Sin mascota'),
        el('dt', { class: 'col-sm-4' }, 'Adoptante'),
        el('dd', { class: 'col-sm-8' }, adoption.adopter?.name ?? 'Sin adoptante'),
        el('dt', { class: 'col-sm-4' }, 'Refugio'),
        el('dd', { class: 'col-sm-8' }, adoption.pet?.shelter?.name ?? 'Sin refugio'),
        el('dt', { class: 'col-sm-4' }, 'Estado'),
        el(
          'dd',
          { class: 'col-sm-8 mb-0' },
          el('span', { class: 'badge text-bg-secondary' }, statusLabel(adoption.status)),
        ),
      ),
    ),
  );
}

function buildAssigned(veterinarian, onRemove) {
  return el(
    'div',
    { class: 'd-flex flex-wrap justify-content-between align-items-center gap-3' },
    el(
      'div',
      {},
      el('div', { class: 'fw-bold' }, veterinarian.name),
      el('div', { class: 'small text-body-secondary' }, veterinarian.speciality),
      personalData(veterinarian)
        ? el('div', { class: 'small text-body-secondary' }, personalData(veterinarian))
        : null,
    ),
    el(
      'div',
      { class: 'd-flex gap-2' },
      el(
        'a',
        {
          class: 'btn btn-outline-primary btn-sm',
          href: veterinarianHistoryHref(veterinarian.id),
        },
        'Historial médico',
      ),
      el(
        'button',
        { class: 'btn btn-outline-danger btn-sm', type: 'button', onClick: onRemove },
        'Quitar veterinario',
      ),
    ),
  );
}

function buildCandidate(veterinarian, onAssign) {
  const available = isAvailable(veterinarian);
  return el(
    'li',
    { class: 'list-group-item d-flex justify-content-between align-items-center gap-3' },
    el(
      'div',
      {},
      el('div', { class: 'fw-bold' }, veterinarian.name),
      el('div', { class: 'small text-body-secondary' }, veterinarian.speciality),
      personalData(veterinarian)
        ? el('div', { class: 'small text-body-secondary' }, personalData(veterinarian))
        : null,
    ),
    el(
      'div',
      { class: 'd-flex align-items-center gap-2' },
      availabilityBadge(veterinarian),
      el(
        'button',
        {
          class: 'btn btn-primary btn-sm',
          type: 'button',
          disabled: !available,
          onClick: () => onAssign(veterinarian),
        },
        'Asignar',
      ),
    ),
  );
}

function buildCandidates(veterinarians, onAssign) {
  if (veterinarians.length === 0) {
    return el(
      'p',
      { class: 'mb-0 text-body-secondary' },
      'Este refugio aún no tiene veterinarios. ',
      el('a', { href: 'veterinarios.html' }, 'Registra uno'),
      ' para poder asignarlo.',
    );
  }
  return el(
    'ul',
    { class: 'list-group list-group-flush' },
    ...veterinarians.map((veterinarian) => buildCandidate(veterinarian, onAssign)),
  );
}

function buildVeterinarianSection(adoption, candidates, { onAssign, onRemove }) {
  let content;
  if (adoption.veterinarian) {
    content = buildAssigned(adoption.veterinarian, onRemove);
  } else if (!isActiveAdoption(adoption)) {
    content = el(
      'p',
      { class: 'mb-0 text-body-secondary' },
      'Solo se puede asignar un veterinario a una adopción en proceso o en convivencia.',
    );
  } else if (adoption.pet?.shelter?.id == null) {
    content = el(
      'p',
      { class: 'mb-0 text-body-secondary' },
      'La mascota no tiene refugio, así que no hay veterinarios para elegir.',
    );
  } else {
    content = buildCandidates(candidates, onAssign);
  }
  return el(
    'section',
    { class: 'card', 'aria-labelledby': 'adoption-vet-title' },
    el(
      'div',
      { class: 'card-body' },
      el(
        'h2',
        { class: 'h5 card-title mb-3', id: 'adoption-vet-title' },
        adoption.veterinarian ? 'Veterinario asignado' : 'Veterinarios del refugio',
      ),
      content,
    ),
  );
}

/**
 * Datos de la adopción y su veterinario: el asignado (con opción de quitarlo) o, si no tiene
 * y la adopción sigue activa, los veterinarios del refugio con su disponibilidad.
 */
export function renderAdoptionVeterinarianPanel(
  container,
  { adoption, candidates = [], onAssign, onRemove },
) {
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    buildAdoptionCard(adoption),
    buildVeterinarianSection(adoption, candidates, { onAssign, onRemove }),
  );
}
