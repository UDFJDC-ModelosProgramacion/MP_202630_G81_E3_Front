import { el, clear } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  APPROVED: 'Aprobada',
  COMPLETED: 'Completada',
};
const NO_STATUS_TEXT = 'Sin estado';
const MISSING_DESCRIPTION = 'Requisito sin descripción';

/** Estado en español; si el back envía un valor desconocido se muestra tal cual. */
export function statusLabel(status) {
  const value = typeof status === 'string' ? status.trim() : '';
  if (!value) return NO_STATUS_TEXT;
  return STATUS_LABELS[value.toUpperCase()] ?? value;
}

function requirementTag(requirement) {
  const mandatory = requirement?.isMandatory ?? requirement?.mandatory;
  if (mandatory === true) {
    return el('span', { class: 'process-tag process-tag--mandatory' }, 'Obligatorio');
  }
  if (mandatory === false) {
    return el('span', { class: 'process-tag process-tag--optional' }, 'Opcional');
  }
  return null;
}

function requirementItem(requirement) {
  const description =
    typeof requirement?.description === 'string' ? requirement.description.trim() : '';
  return el(
    'li',
    { class: 'process-requirement' },
    el('span', { class: 'process-requirement__text' }, description || MISSING_DESCRIPTION),
    requirementTag(requirement),
  );
}

function requirementsSection(requirements) {
  const items = Array.isArray(requirements) ? requirements : [];
  return el(
    'section',
    { class: 'process__section', 'aria-labelledby': 'process-requirements-title' },
    el('h2', { id: 'process-requirements-title', class: 'process__heading' }, 'Requisitos'),
    items.length > 0
      ? el('ul', { class: 'process-requirements' }, ...items.map(requirementItem))
      : el('p', { class: 'process__empty' }, 'Esta adopción no tiene requisitos asociados.'),
  );
}

function contractSection(adoption) {
  const contract = adoption.contract;
  const body = contract
    ? [
        el(
          'p',
          { class: 'process__contract' },
          `Fecha del contrato: ${formatDate(contract.signedDate)}`,
        ),
        el(
          'a',
          {
            class: 'process__link',
            href: `contract.html?adoption=${encodeURIComponent(adoption.id)}`,
          },
          'Ver contrato completo',
        ),
      ]
    : [el('p', { class: 'process__empty' }, 'Esta adopción aún no tiene contrato.')];

  return el(
    'section',
    { class: 'process__section', 'aria-labelledby': 'process-contract-title' },
    el('h2', { id: 'process-contract-title', class: 'process__heading' }, 'Contrato'),
    ...body,
  );
}

function fact(label, value) {
  return el('div', { class: 'process__fact' }, el('dt', {}, label), el('dd', {}, value));
}

/** Pinta la información del proceso de adopción. Todo se inserta como texto, no como HTML. */
export function renderAdoptionProcess(container, adoption) {
  const number = adoption.id === undefined || adoption.id === null ? null : `n.º ${adoption.id}`;

  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'article',
      { class: 'process' },
      el(
        'dl',
        { class: 'process__meta' },
        number ? fact('Adopción', number) : null,
        fact('Fecha de adopción', formatDate(adoption.adoptionDate)),
        fact('Estado', el('span', { class: 'process__status' }, statusLabel(adoption.status))),
      ),
      requirementsSection(adoption.requirements),
      contractSection(adoption),
    ),
  );
}
