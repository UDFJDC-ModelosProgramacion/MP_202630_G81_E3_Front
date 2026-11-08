import { getPet } from '../api/petManagementApi.js';
import { getPetEvents } from '../api/petEventsApi.js';
import { createEventTimeline } from '../components/eventTimeline.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { eventTypeLabel, eventTypes, filterEvents, sortEvents } from '../domain/petEvents.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const backLink = () =>
  el('a', { class: 'btn btn--outline', href: 'pets.html' }, 'Volver a mascotas');

/**
 * Historial de eventos de una mascota, cronológico y filtrable por tipo.
 * Los eventos se piden una sola vez y el filtro se aplica en pantalla.
 */
export async function renderPetEventsPage(
  mount,
  petId,
  { fetchEvents = getPetEvents, fetchPet = getPet } = {},
) {
  let events = [];
  let selected = '';

  const title = el('h1', { class: 'page-title' }, 'Historial de eventos');
  const filters = el('div', {
    class: 'chips event-filters',
    role: 'group',
    'aria-label': 'Filtrar por tipo',
  });
  const count = el('p', { class: 'pets-toolbar__count', 'aria-live': 'polite' });
  const results = el('section', { 'aria-label': 'Eventos' });

  function paintFilters() {
    const options = ['', ...eventTypes(events)];
    clear(filters).append(
      ...options.map((type) =>
        el(
          'button',
          {
            class: 'btn event-filter',
            type: 'button',
            'aria-pressed': String(type === selected),
            onClick: () => {
              selected = type;
              paintFilters();
              paintEvents();
            },
          },
          type ? eventTypeLabel(type) : 'Todos',
        ),
      ),
    );
  }

  function paintEvents() {
    const visible = filterEvents(events, selected);
    count.textContent = `${visible.length} ${visible.length === 1 ? 'evento' : 'eventos'}`;
    results.setAttribute('aria-busy', 'false');
    clear(results).append(createEventTimeline(visible));
  }

  async function load() {
    renderLoading(results, 'Cargando historial…');
    try {
      const [payload, pet] = await Promise.all([
        fetchEvents(petId),
        fetchPet(petId).catch(() => null),
      ]);
      if (pet?.name) title.textContent = `Historial de ${pet.name}`;
      events = sortEvents(Array.isArray(payload) ? payload : []);
      if (events.length === 0) {
        count.textContent = '';
        clear(filters);
        renderEmpty(results, {
          title: 'Aún no hay eventos registrados',
          text: 'Cuando el refugio registre eventos de esta mascota, los verás aquí.',
        });
        return;
      }
      paintFilters();
      paintEvents();
    } catch (error) {
      count.textContent = '';
      clear(filters);
      if (error.status === 404) {
        renderEmpty(results, {
          title: 'Mascota no encontrada',
          text: 'Revisa el enlace o vuelve al listado de mascotas.',
        });
        return;
      }
      renderError(results, {
        title: 'No pudimos cargar el historial',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  clear(mount).append(
    el('p', { class: 'eyebrow' }, 'MASCOTA'),
    title,
    el(
      'p',
      { class: 'page-lead' },
      'Los hechos más relevantes de su vida, del más antiguo al más reciente.',
    ),
    el('div', { class: 'pets-toolbar' }, count, backLink()),
    filters,
    results,
  );
  return load();
}
