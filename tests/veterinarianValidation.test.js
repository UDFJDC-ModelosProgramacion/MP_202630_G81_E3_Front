import { describe, expect, it } from 'vitest';
import { validateVeterinarian } from '../src/js/utils/veterinarianValidation.js';

const valid = { name: 'Laura Ruiz', speciality: 'Cirugía', shelterId: '1' };

describe('validateVeterinarian', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateVeterinarian(valid)).toEqual({});
  });

  it.each([
    ['name', 'El nombre es obligatorio.'],
    ['speciality', 'La especialidad es obligatoria.'],
    ['shelterId', 'Selecciona el refugio donde trabaja.'],
  ])('rechaza %s vacío, en blanco o ausente', (field, message) => {
    expect(validateVeterinarian({ ...valid, [field]: '' })[field]).toBe(message);
    expect(validateVeterinarian({ ...valid, [field]: '   ' })[field]).toBe(message);
    expect(validateVeterinarian({ ...valid, [field]: undefined })[field]).toBe(message);
  });

  it('informa todos los campos inválidos a la vez', () => {
    expect(Object.keys(validateVeterinarian({}))).toEqual(['name', 'speciality', 'shelterId']);
  });
});
