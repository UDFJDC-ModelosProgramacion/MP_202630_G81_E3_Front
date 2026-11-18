import { describe, expect, it } from 'vitest';
import { validateVeterinarian } from '../src/js/utils/veterinarianValidation.js';

const valid = {
  name: 'Laura Ruiz',
  speciality: 'Cirugía',
  age: '35',
  gender: 'FEMALE',
  shelterId: '1',
};

describe('validateVeterinarian', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateVeterinarian(valid)).toEqual({});
  });

  it.each([
    ['name', 'El nombre es obligatorio.'],
    ['speciality', 'La especialidad es obligatoria.'],
    ['age', 'La edad es obligatoria.'],
    ['shelterId', 'Selecciona el refugio donde trabaja.'],
  ])('rechaza %s vacío, en blanco o ausente', (field, message) => {
    expect(validateVeterinarian({ ...valid, [field]: '' })[field]).toBe(message);
    expect(validateVeterinarian({ ...valid, [field]: '   ' })[field]).toBe(message);
    expect(validateVeterinarian({ ...valid, [field]: undefined })[field]).toBe(message);
  });

  it.each(['17', '101', '30.5', 'abc', '-3'])('rechaza la edad %s', (age) => {
    expect(validateVeterinarian({ ...valid, age }).age).toBe(
      'La edad debe ser un número entero entre 18 y 100.',
    );
  });

  it.each(['18', '100', 45])('acepta la edad %s', (age) => {
    expect(validateVeterinarian({ ...valid, age }).age).toBeUndefined();
  });

  it.each(['', 'female', 'OTRO', undefined])('rechaza el género %s', (gender) => {
    expect(validateVeterinarian({ ...valid, gender }).gender).toBe('Selecciona el género.');
  });

  it('informa todos los campos inválidos a la vez', () => {
    expect(Object.keys(validateVeterinarian({}))).toEqual([
      'name',
      'speciality',
      'age',
      'gender',
      'shelterId',
    ]);
  });
});
