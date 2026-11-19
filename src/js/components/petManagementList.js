import { petStatusLabel } from '../domain/petManagement.js';
import { clear, el } from '../utils/dom.js';
import { petPhoto, speciesLabel } from '../utils/petImage.js';
import { renderEmpty } from './stateViews.js';

function petRow(pet, { onEdit, editingId }) {
  const isEditing = String(pet.id) === String(editingId);
  return el(
    'tr',
    { class: isEditing ? 'table-active' : false },
    el(
      'th',
      { scope: 'row' },
      el('img', { class: 'pet-avatar', src: petPhoto(pet), alt: '' }),
      pet.name,
    ),
    el('td', {}, speciesLabel(pet.species) || '—'),
    el('td', {}, el('span', { class: 'badge text-bg-secondary' }, petStatusLabel(pet.status))),
    el('td', {}, pet.shelter?.name ?? '—'),
    el(
      'td',
      { class: 'text-end' },
      el(
        'button',
        {
          class: 'btn btn-sm btn-outline-primary',
          type: 'button',
          'aria-label': `Editar a ${pet.name}`,
          onClick: () => onEdit(pet),
        },
        'Editar',
      ),
    ),
  );
}

export function renderPetManagementList(container, pets, { onEdit, editingId = null } = {}) {
  if (pets.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay mascotas registradas',
      text: 'Registra la primera con el formulario.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'table-responsive' },
      el(
        'table',
        { class: 'table table-hover align-middle' },
        el(
          'thead',
          {},
          el(
            'tr',
            {},
            el('th', { scope: 'col' }, 'Nombre'),
            el('th', { scope: 'col' }, 'Tipo'),
            el('th', { scope: 'col' }, 'Estado'),
            el('th', { scope: 'col' }, 'Refugio'),
            el('th', { scope: 'col', class: 'text-end' }, 'Acciones'),
          ),
        ),
        el('tbody', {}, ...pets.map((pet) => petRow(pet, { onEdit, editingId }))),
      ),
    ),
  );
}
