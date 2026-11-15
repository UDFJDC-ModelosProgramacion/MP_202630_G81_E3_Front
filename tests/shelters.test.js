import { describe, expect, it } from 'vitest';
import { citiesOf, petCountLabel, petCountOf } from '../src/js/domain/shelters.js';

describe('citiesOf', () => {
  it('devuelve las ciudades sin repetir y ordenadas', () => {
    const shelters = [{ city: 'Medellín' }, { city: 'Bogotá' }, { city: 'Medellín' }];
    expect(citiesOf(shelters)).toEqual(['Bogotá', 'Medellín']);
  });

  it('descarta ciudades vacías o ausentes', () => {
    expect(citiesOf([{ city: '' }, { city: null }, {}, { city: 'Cali' }])).toEqual(['Cali']);
  });
});

describe('petCountOf y petCountLabel', () => {
  it('cuenta las mascotas y tolera que falten', () => {
    expect(petCountOf({ pets: [{ id: 1 }, { id: 2 }] })).toBe(2);
    expect(petCountOf({})).toBe(0);
  });

  it.each([
    [0, '0 mascotas'],
    [1, '1 mascota'],
    [3, '3 mascotas'],
  ])('%i → "%s"', (count, expected) => {
    expect(petCountLabel(count)).toBe(expected);
  });
});
