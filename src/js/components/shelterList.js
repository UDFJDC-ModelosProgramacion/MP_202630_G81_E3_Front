import { petCountLabel, petCountOf } from '../domain/shelters.js';
import { splitLinks, validateShelter } from '../domain/shelters.js';
import { clear, el } from '../utils/dom.js';
import { feedback, field, readForm, runTask } from '../utils/ui.js';
import { renderEmpty } from './stateViews.js';

/** Enlace al detalle de un refugio. */
export const shelterHref = (id) => `shelters.html?id=${encodeURIComponent(id)}`;

function shelterCard(shelter) {
  return el(
    'div',
    { class: 'col' },
    el(
      'a',
      {
        class: 'card h-100 shadow-sm text-decoration-none text-reset',
        href: shelterHref(shelter.id),
      },
      el(
        'div',
        { class: 'card-body' },
        el('h2', { class: 'h5 card-title' }, shelter.name),
        el('p', { class: 'text-body-secondary mb-2' }, shelter.city),
        el('span', { class: 'badge text-bg-secondary' }, petCountLabel(petCountOf(shelter))),
      ),
    ),
  );
}

/** Formulario de registro de refugio: nombre, ciudad y enlaces a fotos y videos (uno por línea). */
export function createShelterForm({ onSubmit }) {
  const fb = feedback();
  const name = field({ label: 'Nombre del refugio', name: 'name', required: true, maxlength: 100 });
  const city = field({ label: 'Ciudad', name: 'city', required: true, maxlength: 100 });
  const photos = field({
    label: 'Fotos de las instalaciones',
    name: 'photos',
    rows: 3,
    hint: 'Un enlace http(s) por línea.',
  });
  const videos = field({
    label: 'Videos de las instalaciones',
    name: 'videos',
    rows: 3,
    hint: 'Un enlace http(s) por línea.',
  });
  const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, 'Registrar refugio');
  const form = el(
    'form',
    {
      class: 'fx-form',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();
        const values = readForm(form);
        const problem = validateShelter(values);
        if (problem) return fb.error(problem);
        const ok = await runTask({ button: submit, fb, pendingLabel: 'Registrando…' }, () =>
          onSubmit({
            name: values.name,
            city: values.city,
            photos: splitLinks(values.photos),
            videos: splitLinks(values.videos),
          }),
        );
        if (ok) {
          form.reset();
          fb.success('Refugio registrado.');
        }
        return undefined;
      },
    },
    name.root,
    city.root,
    photos.root,
    videos.root,
    submit,
  );
  return el(
    'details',
    { class: 'fx-panel' },
    el('summary', { class: 'fx-panel__title' }, 'Registrar un refugio'),
    form,
    fb.node,
  );
}

function renderNoResults(container, city, onShowAll) {
  if (!city) {
    renderEmpty(container, {
      title: 'Aún no hay refugios',
      text: 'Cuando se registre un refugio aparecerá aquí.',
    });
    return;
  }
  renderEmpty(container, {
    title: `No hay refugios en ${city}`,
    text: 'No hay refugios registrados en esa ciudad.',
    actionLabel: 'Ver todos los refugios',
    onAction: onShowAll,
  });
}

/**
 * Pinta los refugios como tarjetas (nombre, ciudad y número de mascotas).
 * Si no hay resultados muestra el estado vacío; con ciudad ofrece volver a ver todos.
 */
export function renderShelterList(container, shelters, { city = '', onShowAll } = {}) {
  if (shelters.length === 0) {
    renderNoResults(container, city, onShowAll);
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3' },
      ...shelters.map(shelterCard),
    ),
  );
}
