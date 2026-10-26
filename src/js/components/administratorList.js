import { el, clear } from '../utils/dom.js';
import { roleLabel } from '../domain/administratorRoles.js';
import { renderEmpty } from './stateViews.js';

const shelterLabel = (shelter) => `${shelter.name} · ${shelter.city}`;

function buildAssociatedShelters(shelters) {
  const content = shelters.length
    ? el(
        'ul',
        { class: 'list-inline mb-3' },
        ...shelters.map((shelter) =>
          el(
            'li',
            { class: 'list-inline-item' },
            el('span', { class: 'badge text-bg-light border' }, shelterLabel(shelter)),
          ),
        ),
      )
    : el('p', { class: 'text-body-secondary small mb-3' }, 'Aún no tiene refugios asociados.');
  return el('div', {}, el('h4', { class: 'h6' }, 'Refugios asociados'), content);
}

function buildShelterOption(administrator, shelter) {
  const id = `administrator-${administrator.id}-shelter-${shelter.id}`;
  return el(
    'div',
    { class: 'form-check' },
    el('input', { class: 'form-check-input', type: 'checkbox', id, value: shelter.id }),
    el('label', { class: 'form-check-label', for: id }, shelterLabel(shelter)),
  );
}

function selectedShelterIds(form) {
  return [...form.querySelectorAll('input[type="checkbox"]:checked')].map((input) =>
    Number(input.value),
  );
}

function buildAssociationForm(administrator, shelters, onAssociate) {
  if (shelters.length === 0) {
    return el('p', { class: 'small text-body-secondary mb-0' }, 'No hay refugios para asociar.');
  }
  const form = el(
    'form',
    {
      class: 'mt-3',
      onSubmit: (event) => {
        event.preventDefault();
        onAssociate(administrator, selectedShelterIds(form));
      },
    },
    el(
      'fieldset',
      {},
      el('legend', { class: 'visually-hidden' }, `Refugios para ${administrator.name}`),
      ...shelters.map((shelter) => buildShelterOption(administrator, shelter)),
    ),
    el('button', { class: 'btn btn-primary mt-3', type: 'submit' }, 'Guardar asociación'),
  );
  return el('details', {}, el('summary', { class: 'fw-medium' }, 'Asociar refugios'), form);
}

function buildCard(administrator, shelters, { onAssociate, onDelete }) {
  return el(
    'article',
    { class: 'card h-100' },
    el(
      'div',
      { class: 'card-body' },
      el('h3', { class: 'h5 card-title mb-1' }, administrator.name),
      el('p', { class: 'text-body-secondary mb-2' }, administrator.email),
      el('span', { class: 'badge text-bg-secondary mb-3' }, roleLabel(administrator.role)),
      buildAssociatedShelters(administrator.shelters ?? []),
      buildAssociationForm(administrator, shelters, onAssociate),
    ),
    el(
      'div',
      { class: 'card-footer bg-transparent' },
      el(
        'button',
        { class: 'btn btn-outline-danger', type: 'button', onClick: () => onDelete(administrator) },
        'Eliminar',
      ),
    ),
  );
}

/** Pinta el listado de administradores con sus refugios y el formulario para asociar más. */
export function renderAdministratorList(
  container,
  { administrators, shelters, onAssociate, onDelete },
) {
  if (administrators.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay administradores',
      text: 'Registra el primero con el formulario.',
    });
    return;
  }
  const cards = administrators.map((administrator) =>
    el('div', { class: 'col' }, buildCard(administrator, shelters, { onAssociate, onDelete })),
  );
  container.setAttribute('aria-busy', 'false');
  clear(container).append(el('div', { class: 'row row-cols-1 row-cols-xl-2 g-3' }, ...cards));
}
