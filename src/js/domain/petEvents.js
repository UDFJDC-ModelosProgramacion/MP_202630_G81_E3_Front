import { toIsoDate } from '../utils/format.js';

const TYPE_LABELS = {
  ARRIVAL: 'Llegada',
  VACCINATION: 'Vacunación',
  SURGERY: 'Cirugía',
};

/** Texto visible del tipo de evento; los tipos sin traducción se muestran tal cual. */
export function eventTypeLabel(type) {
  if (typeof type !== 'string' || !type.trim()) return 'Evento';
  return TYPE_LABELS[type] ?? type;
}

/** Ordena cronológicamente (más antiguo primero); los eventos sin fecha válida van al final. */
export function sortEvents(events) {
  const key = (event) => toIsoDate(event.date) ?? '9999-99-99';
  return [...events].sort((a, b) => key(a).localeCompare(key(b)));
}

/** Tipos distintos presentes en la lista, en el orden en que aparecen. */
export function eventTypes(events) {
  return [...new Set(events.map((event) => event.eventType).filter(Boolean))];
}

/** Eventos de un tipo; sin tipo devuelve todos. */
export function filterEvents(events, type) {
  return type ? events.filter((event) => event.eventType === type) : events;
}
