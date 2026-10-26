import { describe, expect, it } from 'vitest';
import { validateAdministrator } from '../src/js/utils/validation.js';

const valid = { name: 'Marta Gómez', email: 'marta@huellitas.org', role: 'DIRECTOR' };

describe('validateAdministrator', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateAdministrator(valid)).toEqual({});
  });

  it.each([
    ['name', 'El nombre es obligatorio.'],
    ['email', 'El correo es obligatorio.'],
    ['role', 'El rol es obligatorio.'],
  ])('rechaza %s vacío, en blanco o ausente', (field, message) => {
    expect(validateAdministrator({ ...valid, [field]: '' })[field]).toBe(message);
    expect(validateAdministrator({ ...valid, [field]: '   ' })[field]).toBe(message);
    expect(validateAdministrator({ ...valid, [field]: undefined })[field]).toBe(message);
  });

  it('rechaza un correo con formato inválido', () => {
    expect(validateAdministrator({ ...valid, email: 'marta@' }).email).toBe(
      'El correo no tiene un formato válido.',
    );
  });

  it('informa todos los campos inválidos a la vez', () => {
    expect(Object.keys(validateAdministrator({ name: '', email: '', role: '' }))).toEqual([
      'name',
      'email',
      'role',
    ]);
  });
});
