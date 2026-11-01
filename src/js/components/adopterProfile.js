import { ApiError } from '../api/httpClient.js';
import { el, clear } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const NO_ADOPTIONS_MESSAGE = 'Este adoptante aún no tiene adopciones';
export const HAS_ADOPTIONS_MESSAGE =
  'No se puede eliminar: el adoptante tiene adopciones registradas.';

/** "2026-09-20" → "20/09/2026". Si el valor no tiene ese formato se muestra tal cual. */
export function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return value ? String(value) : 'Sin fecha';
}

function deleteErrorMessage(error) {
  const rejected = error instanceof ApiError && (error.status === 400 || error.status === 412);
  return rejected ? HAS_ADOPTIONS_MESSAGE : friendlyMessage(error);
}

function adoptionItem(adoption) {
  return el(
    'li',
    { class: 'adoption-item' },
    el('span', { class: 'adoption-item__date' }, formatDate(adoption.adoptionDate)),
    el('span', { class: 'chip' }, adoption.status || 'Sin estado'),
  );
}

/**
 * Pinta el perfil de un adoptante: nombre, teléfono, adopciones y botón de eliminar.
 *
 * @param {HTMLElement} container
 * @param {{ name: string, phone?: string, adoptions?: Array }} adopter
 * @param {{ onDelete: () => Promise<void> }} options
 *   `onDelete` borra al adoptante; si falla, el perfil muestra el motivo.
 */
export function renderAdopterProfile(container, adopter, { onDelete }) {
  const adoptions = adopter.adoptions ?? [];
  const feedback = el('p', { class: 'form-feedback form-feedback--error', role: 'alert' });
  const button = el(
    'button',
    { class: 'btn btn--danger', type: 'button', onClick: handleDelete },
    'Eliminar adoptante',
  );

  async function handleDelete() {
    feedback.textContent = '';
    if (adoptions.length > 0) {
      feedback.textContent = HAS_ADOPTIONS_MESSAGE;
      return;
    }
    if (!globalThis.confirm(`¿Eliminar a ${adopter.name}?`)) return;

    button.disabled = true;
    try {
      await onDelete();
    } catch (error) {
      feedback.textContent = deleteErrorMessage(error);
      button.disabled = false;
    }
  }

  const history =
    adoptions.length === 0
      ? el('p', { class: 'state state--empty', role: 'status' }, NO_ADOPTIONS_MESSAGE)
      : el('ul', { class: 'adoption-list' }, ...adoptions.map(adoptionItem));

  clear(container).append(
    el(
      'section',
      { class: 'adopter-profile', 'aria-labelledby': 'adopter-name' },
      el('a', { class: 'back-link', href: 'adopters.html' }, '← Volver al listado'),
      el('h1', { class: 'page-title', id: 'adopter-name' }, adopter.name),
      el('p', { class: 'adopter-profile__phone' }, adopter.phone || 'Sin teléfono'),
      el('h2', { class: 'adopter-profile__subtitle' }, 'Historial de adopciones'),
      history,
      feedback,
      button,
    ),
  );
}
