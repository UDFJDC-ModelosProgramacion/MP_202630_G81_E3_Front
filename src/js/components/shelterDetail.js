import { clear, el } from '../utils/dom.js';
import { calendarTypeLabel } from '../domain/calendar.js';
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
    el(
      'div',
      {},
      el('div', {}, event.title ?? calendarTypeLabel(event.type)),
      event.title
        ? el('small', { class: 'text-body-secondary' }, calendarTypeLabel(event.type))
        : null,
    ),
    el('small', { class: 'text-body-secondary' }, formatDate(event.date)),
  );

const isVideoFile = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

/** Fotos y videos de las instalaciones; los videos que no son archivos se enlazan. */
export function mediaSection(shelter) {
  const photos = shelter.photos ?? [];
  const videos = shelter.videos ?? [];
  if (photos.length === 0 && videos.length === 0) return null;
  return el(
    'section',
    { class: 'fx-panel', 'aria-label': 'Instalaciones' },
    el('h2', { class: 'fx-panel__title' }, 'Conoce las instalaciones'),
    el(
      'div',
      { class: 'fx-media' },
      ...photos.map((url, index) =>
        el('img', {
          src: url,
          alt: `Instalaciones de ${shelter.name}, foto ${index + 1}`,
          loading: 'lazy',
        }),
      ),
      ...videos.map((url, index) =>
        isVideoFile(url)
          ? el('video', {
              src: url,
              controls: true,
              preload: 'metadata',
              'aria-label': `Video ${index + 1} de ${shelter.name}`,
            })
          : el(
              'a',
              { class: 'btn btn--outline', href: url, target: '_blank', rel: 'noopener' },
              `Ver video ${index + 1}`,
            ),
      ),
    ),
  );
}

function shortcuts(shelter) {
  const id = encodeURIComponent(shelter.id);
  return el(
    'div',
    { class: 'fx-actions mb-3' },
    el('a', { class: 'btn btn--outline', href: `calendario.html?shelter=${id}` }, 'Calendario'),
    el(
      'a',
      { class: 'btn btn--outline', href: `mensajes.html?shelter=${id}` },
      'Escribir al refugio',
    ),
    el('a', { class: 'btn btn--outline', href: `reportes.html?shelter=${id}` }, 'Reportes'),
  );
}

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
    shortcuts(shelter),
    mediaSection(shelter),
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
