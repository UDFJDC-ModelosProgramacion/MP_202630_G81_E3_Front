import { describe, expect, it } from 'vitest';
import {
  NO_ADOPTER_NAME,
  NO_PET_NAME,
  adopterNameOf,
  petNameOf,
  sortDevolutions,
} from '../src/js/domain/devolutionHistory.js';

describe('sortDevolutions', () => {
  it('ordena de la más reciente a la más antigua sin mutar el original', () => {
    const items = [
      { id: 1, date: '2026-09-01' },
      { id: 3, date: '2026-10-20' },
      { id: 2, date: '2026-10-20' },
    ];
    expect(sortDevolutions(items).map((item) => item.id)).toEqual([3, 2, 1]);
    expect(items.map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it('sin argumento devuelve una lista vacía', () => {
    expect(sortDevolutions()).toEqual([]);
  });
});

describe('petNameOf y adopterNameOf', () => {
  it('leen los nombres de la adopción', () => {
    const devolution = { adoption: { pet: { name: 'Luna' }, adopter: { name: 'Ana' } } };
    expect(petNameOf(devolution)).toBe('Luna');
    expect(adopterNameOf(devolution)).toBe('Ana');
  });

  it('usan un texto por defecto si el back no los envía', () => {
    expect(petNameOf({})).toBe(NO_PET_NAME);
    expect(adopterNameOf({ adoption: {} })).toBe(NO_ADOPTER_NAME);
  });
});