import { describe, expect, it } from 'vitest';
import { citiesOf, petCountLabel, petCountOf, validateShelter } from '../src/js/domain/shelters.js';

describe('validateShelter', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateShelter({ name: 'Huellitas', city: 'Bogotá' })).toEqual({});
  });

  it.each([
    ['name', 'El nombre es obligatorio.'],
    ['city', 'La ciudad es obligatoria.'],
  ])('rechaza %s vacío, en blanco o ausente', (field, message) => {
    const valid = { name: 'Huellitas', city: 'Bogotá' };
    expect(validateShelter({ ...valid, [field]: '' })[field]).toBe(message);
    expect(validateShelter({ ...valid, [field]: '   ' })[field]).toBe(message);
    expect(validateShelter({ ...valid, [field]: undefined })[field]).toBe(message);
  });

  it('informa ambos campos a la vez', () => {
    expect(Object.keys(validateShelter({}))).toEqual(['name', 'city']);
  });
});

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
