import { describe, expect, it } from 'vitest';
import {
  eventTypeLabel,
  eventTypes,
  filterEvents,
  sortEvents,
} from '../src/js/domain/petEvents.js';

const EVENTS = [
  { id: 3, eventType: 'SURGERY', date: '2026-10-01' },
  { id: 1, eventType: 'ARRIVAL', date: '2026-09-01T00:00:00.000+00:00' },
  { id: 4, eventType: 'RARO', date: null },
  { id: 2, eventType: 'VACCINATION', date: Date.UTC(2026, 8, 15) },
  { id: 5, eventType: 'VACCINATION', date: '2026-11-01' },
];

describe('petEvents', () => {
  it('ordena cronológicamente y deja los eventos sin fecha al final', () => {
    expect(sortEvents(EVENTS).map((e) => e.id)).toEqual([1, 2, 3, 5, 4]);
  });

  it('no modifica la lista original', () => {
    const copy = [...EVENTS];
    sortEvents(EVENTS);
    expect(EVENTS).toEqual(copy);
  });

  it('lista los tipos distintos', () => {
    expect(eventTypes(EVENTS)).toEqual(['SURGERY', 'ARRIVAL', 'RARO', 'VACCINATION']);
    expect(eventTypes([{ eventType: null }])).toEqual([]);
  });

  it('filtra por tipo o devuelve todo', () => {
    expect(filterEvents(EVENTS, 'VACCINATION').map((e) => e.id)).toEqual([2, 5]);
    expect(filterEvents(EVENTS, '')).toBe(EVENTS);
  });

  it('traduce los tipos conocidos y deja los demás tal cual', () => {
    expect(eventTypeLabel('ARRIVAL')).toBe('Llegada');
    expect(eventTypeLabel('VACCINATION')).toBe('Vacunación');
    expect(eventTypeLabel('SURGERY')).toBe('Cirugía');
    expect(eventTypeLabel('RARO')).toBe('RARO');
    expect(eventTypeLabel('')).toBe('Evento');
    expect(eventTypeLabel(undefined)).toBe('Evento');
  });
});
