import { describe, expect, it } from 'vitest';
import {
  followableAdoptions,
  petNameOf,
  sortFollowUps,
  statusLabel,
  todayIso,
  validateFollowUp,
} from '../src/js/domain/followUps.js';

const TODAY = '2026-11-02';
const VALID = { date: '2026-11-01', adaptationStatus: 'GOOD', observations: 'Ya come bien.' };

describe('validateFollowUp', () => {
  it('no reporta errores con datos completos', () => {
    expect(validateFollowUp(VALID, TODAY)).toEqual({});
  });

  it('indica cada campo obligatorio que falta', () => {
    const errors = validateFollowUp({ date: '', adaptationStatus: '', observations: '  ' }, TODAY);
    expect(Object.keys(errors)).toEqual(['date', 'adaptationStatus', 'observations']);
  });

  it('rechaza fechas inexistentes y futuras', () => {
    expect(validateFollowUp({ ...VALID, date: '2026-02-31' }, TODAY).date).toBe('La fecha no es válida.');
    expect(validateFollowUp({ ...VALID, date: '2026-11-03' }, TODAY).date).toBe(
      'La fecha no puede ser futura.',
    );
  });

  it('rechaza un estado desconocido y observaciones demasiado largas', () => {
    expect(validateFollowUp({ ...VALID, adaptationStatus: 'X' }, TODAY)).toHaveProperty(
      'adaptationStatus',
    );
    expect(validateFollowUp({ ...VALID, observations: 'a'.repeat(256) }, TODAY)).toHaveProperty(
      'observations',
    );
  });
});

describe('sortFollowUps', () => {
  it('ordena del más reciente al más antiguo sin mutar el original', () => {
    const items = [
      { id: 1, date: '2026-10-01' },
      { id: 3, date: '2026-10-20' },
      { id: 2, date: '2026-10-20' },
    ];
    expect(sortFollowUps(items).map((item) => item.id)).toEqual([3, 2, 1]);
    expect(items.map((item) => item.id)).toEqual([1, 3, 2]);
  });
});

describe('utilidades', () => {
  it('followableAdoptions excluye las canceladas o rechazadas', () => {
    const list = [{ status: 'COMPLETED' }, { status: 'cancelled' }, { status: 'REJECTED' }];
    expect(followableAdoptions(list)).toEqual([{ status: 'COMPLETED' }]);
    expect(followableAdoptions()).toEqual([]);
  });

  it('statusLabel, petNameOf y todayIso', () => {
    expect(statusLabel('GOOD')).toBe('Adaptación buena');
    expect(statusLabel('?')).toBe('Sin estado');
    expect(petNameOf({ pet: { name: 'Luna' } })).toBe('Luna');
    expect(petNameOf({})).toBe('Mascota sin nombre');
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
