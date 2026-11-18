import { describe, expect, it } from 'vitest';
import {
  adoptionStatusKind,
  adoptionStatusLabel,
  isLivingWithAdopter,
} from '../src/js/domain/adoptionStatus.js';
import { calendarTypeLabel, filterByType } from '../src/js/domain/calendar.js';
import { splitLinks, validateShelter } from '../src/js/domain/shelters.js';
import { upcomingVaccinations, validateVaccination } from '../src/js/domain/vaccinations.js';
import { validateAdopterEvent, validatePhotoUrl } from '../src/js/pages/adopterUpdatesPage.js';
import { validatePeriod } from '../src/js/pages/coexistencePage.js';
import { validateCalendarEvent } from '../src/js/pages/calendarPage.js';
import { validateMessage } from '../src/js/pages/messagesPage.js';
import { barList } from '../src/js/pages/reportsPage.js';
import { stars } from '../src/js/pages/successStoriesPage.js';
import { validateVeterinarian } from '../src/js/utils/veterinarianValidation.js';
import { addDaysIso, toInputDate } from '../src/js/utils/dates.js';

const TODAY = '2026-11-17';

describe('vacunas', () => {
  it('próximas dosis: solo hoy o futuras, de la más cercana a la más lejana', () => {
    const list = [
      { name: 'a', nextDueDate: '2026-12-30' },
      { name: 'b', nextDueDate: '2026-10-01' },
      { name: 'c', nextDueDate: '2026-11-17' },
      { name: 'd', nextDueDate: null },
    ];
    expect(upcomingVaccinations(list, TODAY).map((v) => v.name)).toEqual(['c', 'a']);
  });

  it('valida nombre, fechas y orden', () => {
    expect(validateVaccination({ name: 'Rabia', applicationDate: '2026-11-01' }, TODAY)).toEqual(
      {},
    );
    expect(Object.keys(validateVaccination({ name: '', applicationDate: '' }, TODAY))).toEqual([
      'name',
      'applicationDate',
    ]);
    expect(
      validateVaccination({ name: 'x', applicationDate: '2026-12-01' }, TODAY).applicationDate,
    ).toBeTruthy();
    expect(
      validateVaccination(
        { name: 'x', applicationDate: '2026-11-10', nextDueDate: '2026-11-01' },
        TODAY,
      ).nextDueDate,
    ).toBeTruthy();
  });
});

describe('estados y calendario', () => {
  it('etiquetas y tipos de adopción', () => {
    expect(adoptionStatusLabel('COHABITATION')).toBe('En convivencia de prueba');
    expect(adoptionStatusLabel('X')).toBe('X');
    expect(adoptionStatusKind('COMPLETED')).toBe('success');
    expect(adoptionStatusKind('PENDING')).toBe('warning');
    expect(isLivingWithAdopter('PENDING')).toBe(false);
    expect(isLivingWithAdopter('COMPLETED')).toBe(true);
  });

  it('tipos de evento del calendario', () => {
    expect(calendarTypeLabel('WORKSHOP')).toBe('Taller de cuidado');
    const events = [{ type: 'FAIR' }, { type: 'WORKSHOP' }];
    expect(filterByType(events, 'FAIR')).toHaveLength(1);
    expect(filterByType(events)).toHaveLength(2);
  });
});

describe('validaciones de formularios', () => {
  it('refugio: nombre, ciudad y enlaces', () => {
    expect(splitLinks(' https://a.test\n\n https://b.test ')).toEqual([
      'https://a.test',
      'https://b.test',
    ]);
    expect(validateShelter({ name: '', city: 'x' })).toMatch(/nombre/);
    expect(validateShelter({ name: 'a', city: '' })).toMatch(/ciudad/);
    expect(validateShelter({ name: 'a', city: 'b', photos: 'foto.jpg' })).toMatch(/http/);
    expect(
      validateShelter({ name: 'a', city: 'b', photos: 'https://a.test/1.jpg', videos: '' }),
    ).toBeNull();
  });

  it('convivencia: el fin no puede ser anterior al inicio', () => {
    expect(validatePeriod({ startDate: '2026-11-10', endDate: '2026-11-01' })).toBeTruthy();
    expect(validatePeriod({ startDate: '', endDate: '2026-11-01' })).toBeTruthy();
    expect(validatePeriod({ startDate: '2026-11-01', endDate: '2026-11-15' })).toBeNull();
  });

  it('mensaje, evento de calendario, evento del adoptante y foto', () => {
    expect(
      validateMessage({ senderName: 'Ana', senderRole: 'ADOPTER', content: 'Hola' }),
    ).toBeNull();
    expect(
      validateMessage({ senderName: '', senderRole: 'ADOPTER', content: 'Hola' }),
    ).toBeTruthy();
    expect(validateMessage({ senderName: 'Ana', senderRole: 'X', content: 'Hola' })).toBeTruthy();
    expect(
      validateMessage({ senderName: 'Ana', senderRole: 'ADOPTER', content: 'a'.repeat(1001) }),
    ).toBeTruthy();
    expect(validateCalendarEvent({ type: 'FAIR', title: 'Feria', date: TODAY })).toBeNull();
    expect(validateCalendarEvent({ type: 'FAIR', title: '', date: TODAY })).toBeTruthy();
    expect(
      validateAdopterEvent({ eventType: 'ILLNESS', date: '2026-11-01', description: 'Tos' }, TODAY),
    ).toBeNull();
    expect(
      validateAdopterEvent({ eventType: 'ILLNESS', date: '2027-01-01', description: 'Tos' }, TODAY),
    ).toBeTruthy();
    expect(validatePhotoUrl('luna.jpg')).toBeTruthy();
    expect(validatePhotoUrl('https://x.test/luna.jpg')).toBeNull();
  });

  it('veterinario: correo y teléfono opcionales pero válidos', () => {
    const base = { name: 'A', speciality: 'B', shelterId: '1' };
    expect(validateVeterinarian(base)).toEqual({});
    expect(validateVeterinarian({ ...base, email: 'no-es-correo' }).email).toBeTruthy();
    expect(validateVeterinarian({ ...base, phone: 'abc' }).phone).toBeTruthy();
    expect(validateVeterinarian({ ...base, email: 'a@b.co', phone: '300 123 4567' })).toEqual({});
  });
});

describe('utilidades', () => {
  it('fechas', () => {
    expect(toInputDate('2026-11-17T00:00:00.000+00:00')).toBe('2026-11-17');
    expect(toInputDate(Date.UTC(2026, 10, 17))).toBe('2026-11-17');
    expect(toInputDate(null)).toBe('');
    expect(addDaysIso('2026-11-17', 14)).toBe('2026-12-01');
  });

  it('estrellas y barras', () => {
    expect(stars('4')).toBe('★★★★☆');
    expect(stars('9')).toBe('★★★★★');
    const bars = barList({ A: 2, B: 4 });
    expect(bars.querySelectorAll('li')).toHaveLength(2);
    expect(bars.querySelectorAll('.fx-bar__fill')[1].getAttribute('style')).toBe('width:100%');
    expect(barList({}).textContent).toMatch(/Sin datos/);
  });
});
