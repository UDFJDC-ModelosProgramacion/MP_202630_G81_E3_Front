import { matchPets } from '../domain/medicalHistory.js';
import { petStatusLabel } from '../domain/petManagement.js';
import { clear, el } from '../utils/dom.js';

/** Enlace al historial médico de una mascota del veterinario. */
export const medicalHistoryHref = (veterinarianId, petId) =>
  `medical-history.html?veterinarian=${encodeURIComponent(veterinarianId)}` +
  `&pet=${encodeURIComponent(petId)}`;

function petItem(veterinarianId, pet) {
  return el(
    'li',
    {},
    el(
      'a',
      {
        class: 'list-group-item list-group-item-action d-flex justify-content-between',
        href: medicalHistoryHref(veterinarianId, pet.id),
      },
      el('span', {}, pet.name, el('small', { class: 'text-body-secondary ms-2' }, `#${pet.id}`)),
      el('span', { class: 'badge text-bg-light border' }, petStatusLabel(pet.status)),
    ),
  );
}

/**
 * Buscador de mascotas a cargo del veterinario: a medida que escribe (nombre o identificador)
 * se actualizan las coincidencias para que seleccione la correcta.
 *
 * @param {{ pets: Array, veterinarianId: string|number }} options
 * @returns {HTMLElement}
 */
export function createMedicalPetSearch({ pets, veterinarianId }) {
  const results = el('ul', { class: 'list-unstyled list-group mt-3', 'aria-live': 'polite' });
  const status = el('p', { class: 'text-body-secondary mt-2 mb-0', role: 'status' });
  const input = el('input', {
    class: 'form-control',
    id: 'medical-pet-search',
    name: 'search',
    type: 'search',
    autocomplete: 'off',
    placeholder: 'Nombre o identificador de la mascota',
  });

  function paint() {
    const matches = matchPets(pets, input.value);
    clear(results).append(...matches.map((pet) => petItem(veterinarianId, pet)));
    status.textContent =
      matches.length === 0
        ? 'No hay mascotas a tu cargo que coincidan con la búsqueda.'
        : `${matches.length} ${matches.length === 1 ? 'coincidencia' : 'coincidencias'}`;
  }

  input.addEventListener('input', paint);
  paint();

  return el(
    'div',
    {},
    el('label', { class: 'form-label', for: 'medical-pet-search' }, 'Buscar mascota'),
    input,
    status,
    results,
  );
}
