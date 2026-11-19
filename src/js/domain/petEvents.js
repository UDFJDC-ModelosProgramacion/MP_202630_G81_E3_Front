import { toIsoDate } from '../utils/format.js';

const TYPE_LABELS = {
  ARRIVAL: 'Llegada',
  VACCINATION: 'Vacunación',
  SURGERY: 'Cirugía',
};

export function eventTypeLabel(type) {
  if (typeof type !== 'string' || !type.trim()) return 'Evento';
  return TYPE_LABELS[type] ?? type;
}

export function sortEvents(events) {
  const key = (event) => toIsoDate(event.date) ?? '9999-99-99';
  return [...events].sort((a, b) => key(a).localeCompare(key(b)));
}

export function eventTypes(events) {
  return [...new Set(events.map((event) => event.eventType).filter(Boolean))];
}

export function filterEvents(events, type) {
  return type ? events.filter((event) => event.eventType === type) : events;
}
