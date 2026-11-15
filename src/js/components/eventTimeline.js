import { eventTypeLabel } from '../domain/petEvents.js';
import { el } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';

function dateNode(date) {
  const iso = toIsoDate(date);
  const label = formatLongDate(date);
  return iso ? el('time', { class: 'timeline__date', datetime: iso }, label) : label;
}

/** Línea de tiempo: una entrada por evento, en el orden recibido. */
export function createEventTimeline(events) {
  return el(
    'ol',
    { class: 'timeline', 'aria-label': 'Eventos de la mascota' },
    ...events.map((event) =>
      el(
        'li',
        { class: 'timeline__item' },
        el('span', { class: 'badge timeline__type' }, eventTypeLabel(event.eventType)),
        dateNode(event.date),
        event.description ? el('p', { class: 'timeline__text' }, event.description) : null,
      ),
    ),
  );
}
