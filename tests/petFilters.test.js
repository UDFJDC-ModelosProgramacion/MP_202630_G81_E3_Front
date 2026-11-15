import { describe, expect, it } from 'vitest';
import {
  applyClientFilters,
  distinctValues,
  EMPTY_FILTERS,
  hasActiveFilters,
  serverFilters,
} from '../src/js/domain/petFilters.js';

const pets = [
  {
    id: 1,
    sex: 'Hembra',
    size: 'Tamaño pequeño',
    compatibleWithChildren: true,
    compatibleWithOtherPets: false,
    activityLevel: 'LOW',
  },
  {
    id: 2,
    sex: 'Macho',
    size: 'Tamaño grande',
    compatibleWithChildren: false,
    compatibleWithOtherPets: true,
    activityLevel: 'HIGH',
  },
  {
    id: 3,
    sex: 'Macho',
    size: 'Tamaño pequeño',
    compatibleWithChildren: null,
    compatibleWithOtherPets: true,
    activityLevel: 'HIGH',
  },
];
const ids = (list) => list.map((p) => p.id);

describe('applyClientFilters', () => {
  it('sin filtros devuelve todas', () => {
    expect(ids(applyClientFilters(pets, EMPTY_FILTERS))).toEqual([1, 2, 3]);
  });

  it('filtra por tamaño y sexo', () => {
    expect(ids(applyClientFilters(pets, { ...EMPTY_FILTERS, size: 'Tamaño pequeño' }))).toEqual([
      1, 3,
    ]);
    expect(
      ids(applyClientFilters(pets, { ...EMPTY_FILTERS, sex: 'Macho', size: 'Tamaño pequeño' })),
    ).toEqual([3]);
  });

  it('la compatibilidad solo deja las confirmadas', () => {
    expect(ids(applyClientFilters(pets, { ...EMPTY_FILTERS, children: true }))).toEqual([1]);
    expect(ids(applyClientFilters(pets, { ...EMPTY_FILTERS, otherPets: true }))).toEqual([2, 3]);
    expect(
      ids(applyClientFilters(pets, { ...EMPTY_FILTERS, children: true, otherPets: true })),
    ).toEqual([]);
  });
});

describe('utilidades', () => {
  it('distinctValues ordena, quita repetidos y vacíos', () => {
    expect(
      distinctValues([...pets, { activityLevel: null }, { activityLevel: '' }], 'activityLevel'),
    ).toEqual(['HIGH', 'LOW']);
  });

  it('serverFilters extrae solo lo que resuelve el back', () => {
    expect(serverFilters({ ...EMPTY_FILTERS, activityLevel: 'LOW', size: 'x' })).toEqual({
      activityLevel: 'LOW',
      spaceRequirement: '',
    });
  });

  it('hasActiveFilters detecta cualquier filtro activo', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, children: true })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sex: 'Macho' })).toBe(true);
  });
});
