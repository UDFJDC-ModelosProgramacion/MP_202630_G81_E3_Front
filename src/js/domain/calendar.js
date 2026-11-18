export const EVENT_TYPES = [
  { value: 'FAIR', label: 'Feria de adopción' },
  { value: 'WORKSHOP', label: 'Taller de cuidado' },
  { value: 'VACCINATION_CAMPAIGN', label: 'Jornada de vacunación' },
];

export function calendarTypeLabel(type) {
  return EVENT_TYPES.find((option) => option.value === type)?.label ?? type ?? 'Evento';
}

/** Eventos de un tipo; sin tipo devuelve todos. */
export function filterByType(events = [], type = '') {
  return type ? events.filter((event) => event.type === type) : events;
}
