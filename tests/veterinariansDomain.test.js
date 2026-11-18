import { describe, expect, it } from 'vitest';
import { genderLabel, isActiveAdoption, isAvailable } from '../src/js/domain/veterinarians.js';

describe('dominio de veterinarios', () => {
  it('traduce el género y tolera valores desconocidos', () => {
    expect(genderLabel('FEMALE')).toBe('Femenino');
    expect(genderLabel('MALE')).toBe('Masculino');
    expect(genderLabel('OTHER')).toBe('Otro');
    expect(genderLabel(undefined)).toBe('No indicado');
  });

  it.each([
    ['IN_PROGRESS', true],
    ['COHABITATION', true],
    ['COMPLETED', false],
    ['PENDING', false],
    [undefined, false],
  ])('la adopción en estado %s activa = %s', (status, expected) => {
    expect(isActiveAdoption({ status })).toBe(expected);
  });

  it('no hay adopción activa si no hay adopción', () => {
    expect(isActiveAdoption(null)).toBe(false);
  });

  it('un veterinario es disponible salvo que el back diga que no', () => {
    expect(isAvailable({ available: true })).toBe(true);
    expect(isAvailable({})).toBe(true);
    expect(isAvailable({ available: false })).toBe(false);
  });
});
