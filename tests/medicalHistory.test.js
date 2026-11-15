import { describe, expect, it } from 'vitest';
import {
  availableMedicalFields,
  matchPets,
  normalizeText,
  sortMedicalRecords,
} from '../src/js/domain/medicalHistory.js';

const PETS = [
  { id: 1, name: 'Luna' },
  { id: 12, name: 'Ñandú' },
  { id: 20, name: 'Bruno' },
];

describe('matchPets', () => {
  it('sin texto devuelve todas', () => {
    expect(matchPets(PETS, '  ')).toHaveLength(3);
  });

  it('busca por nombre sin distinguir mayúsculas ni tildes', () => {
    expect(matchPets(PETS, 'NANDU').map((p) => p.id)).toEqual([12]);
    expect(matchPets(PETS, 'un').map((p) => p.id)).toEqual([1, 20]);
  });

  it('busca por identificador (prefijo)', () => {
    expect(matchPets(PETS, '1').map((p) => p.id)).toEqual([1, 12]);
    expect(matchPets(PETS, '20').map((p) => p.id)).toEqual([20]);
  });

  it('normalizeText quita tildes y espacios', () => {
    expect(normalizeText('  Cañón ')).toBe('canon');
  });
});

describe('registros', () => {
  it('ordena del más reciente al más antiguo sin mutar el original', () => {
    const items = [
      { id: 1, date: '2026-01-01' },
      { id: 3, date: '2026-05-01' },
      { id: 2, date: '2026-05-01' },
    ];
    expect(sortMedicalRecords(items).map((r) => r.id)).toEqual([3, 2, 1]);
    expect(items[0].id).toBe(1);
  });

  it('availableMedicalFields solo incluye los datos disponibles', () => {
    const fields = availableMedicalFields({ reason: 'Control', diagnosis: ' ', treatment: null });
    expect(fields.map((f) => f.key)).toEqual(['reason']);
  });
});
