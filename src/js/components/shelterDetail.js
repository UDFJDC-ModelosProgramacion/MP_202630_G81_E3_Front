import { clear, el } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';

const petItem = (pet) =>
  el(
    'li',
    { class: 'list-group-item d-flex justify-content-between align-items-center' },
    pet.name,
    el('span', { class: 'badge text-bg-light border' }, pet.status ?? 'Sin estado'),
  );

const veterinarianItem = (veterinarian) =>
  el(
    'li',
    { class: 'list-group-item' },
    el('div', {}, veterinarian.name),
    el('small', { class: 'text-body-secondary' }, veterinarian.speciality),
  );

const eventItem = (event) =>
  el(
    'li',
    { class: 'list-group-item d-flex justify-content-between align-items-center' },
    event.type,
    el('small', { class: 'text-body-secondary' }, formatDate(event.date)),
  );

function section({ title, items, emptyText, buildItem }) {
  const body = items.length
    ? el('ul', { class: 'list-group list-group-flush' }, ...items.map(buildItem))
    : el('p', { class: 'card-body text-body-secondary mb-0' }, emptyText);
  return el(
    'div',
    { class: 'col' },
    el(
      'section',
      { class: 'card h-100' },
      el(
        'div',
        { class: 'card-header d-flex justify-content-between align-items-center' },
        el('h2', { class: 'h5 mb-0' }, title),
        el('span', { class: 'badge text-bg-secondary' }, String(items.length)),
      ),
      body,
    ),
  );
}

function breadcrumb(shelterName) {
  return el(
    'nav',
    { 'aria-label': 'breadcrumb' },
    el(
      'ol',
      { class: 'breadcrumb' },
      el('li', { class: 'breadcrumb-item' }, el('a', { href: 'shelters.html' }, 'Refugios')),
      el('li', { class: 'breadcrumb-item active', 'aria-current': 'page' }, shelterName),
    ),
  );
}

/** Pinta el refugio: nombre, ciudad, mascotas, veterinarios y eventos. */
export function renderShelterDetail(container, shelter) {
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    breadcrumb(shelter.name),
    el('h1', { class: 'page-title' }, shelter.name),
    el('p', { class: 'page-lead' }, shelter.city),
    el(
      'div',
      { class: 'row row-cols-1 row-cols-lg-3 g-3' },
      section({
        title: 'Mascotas',
        items: shelter.pets ?? [],
        emptyText: 'Este refugio aún no tiene mascotas.',
        buildItem: petItem,
      }),
      section({
        title: 'Veterinarios',
        items: shelter.veterinarians ?? [],
        emptyText: 'Este refugio aún no tiene veterinarios.',
        buildItem: veterinarianItem,
      }),
      section({
        title: 'Eventos',
        items: shelter.events ?? [],
        emptyText: 'Este refugio aún no tiene eventos.',
        buildItem: eventItem,
      }),
    ),
  );
}
