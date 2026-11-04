import { describe, expect, it } from 'vitest';
import {
  emptyPetValues,
  petStatusLabel,
  petToValues,
  sortPetsByName,
  toCreatePayload,
  toUpdatePayload,
  validatePetValues,
} from '../src/js/domain/petManagement.js';

const TODAY = '2026-11-02';
const VALID = {
  ...emptyPetValues(TODAY),
  name: ' Luna ',
  age: '3',
  sex: 'Hembra',
  size: 'Tamaño mediano',
  shelterId: '4',
  arrivalDescription: 'Llegó rescatada',
};

describe('validatePetValues', () => {
  it('no reporta errores con datos completos', () => {
    expect(validatePetValues(VALID, { today: TODAY })).toEqual({});
  });

  it('indica todos los campos obligatorios que faltan al registrar', () => {
    const errors = validatePetValues(
      { ...emptyPetValues(TODAY), arrivalDate: '', status: '' },
      { today: TODAY },
    );
    expect(Object.keys(errors).sort()).toEqual(
      [
        'age',
        'arrivalDate',
        'arrivalDescription',
        'name',
        'sex',
        'shelterId',
        'size',
        'status',
      ].sort(),
    );
  });

  it('al actualizar no exige los datos de llegada', () => {
    const errors = validatePetValues(
      { ...VALID, arrivalDate: '', arrivalDescription: '' },
      { isNew: false, today: TODAY },
    );
    expect(errors).toEqual({});
  });

  it('rechaza edad, fecha y textos inválidos', () => {
    expect(validatePetValues({ ...VALID, age: '-1' }, { today: TODAY })).toHaveProperty('age');
    expect(validatePetValues({ ...VALID, age: '2.5' }, { today: TODAY })).toHaveProperty('age');
    expect(
      validatePetValues({ ...VALID, arrivalDate: '2026-11-03' }, { today: TODAY }).arrivalDate,
    ).toBe('La fecha de llegada no puede ser futura.');
    expect(
      validatePetValues({ ...VALID, arrivalDate: '2026-02-31' }, { today: TODAY }).arrivalDate,
    ).toBe('La fecha de llegada no es válida.');
    expect(validatePetValues({ ...VALID, name: 'a'.repeat(101) }, { today: TODAY })).toHaveProperty(
      'name',
    );
    expect(
      validatePetValues({ ...VALID, description: 'a'.repeat(256) }, { today: TODAY }),
    ).toHaveProperty('description');
  });
});

describe('payloads', () => {
  it('toCreatePayload envía la mascota con un único evento ARRIVAL y el refugio', () => {
    const payload = toCreatePayload(VALID);
    expect(payload).toMatchObject({
      name: 'Luna',
      age: 3,
      status: 'AVAILABLE',
      shelter: { id: 4 },
      events: [{ eventType: 'ARRIVAL', date: TODAY, description: 'Llegó rescatada' }],
    });
    expect(payload.activityLevel).toBeNull();
  });

  it('toUpdatePayload conserva las fotos y el refugio, y no manda eventos', () => {
    const payload = toUpdatePayload(VALID, { photos: ['a.png'] });
    expect(payload.photos).toEqual(['a.png']);
    expect(payload.shelter).toEqual({ id: 4 });
    expect(payload).not.toHaveProperty('events');
  });

  it('petToValues rellena el formulario desde la mascota del back', () => {
    const values = petToValues({ name: 'Rocky', age: 2, shelter: { id: 7 }, sex: 'Macho' });
    expect(values).toMatchObject({ name: 'Rocky', age: 2, shelterId: 7, status: 'AVAILABLE' });
  });
});

describe('utilidades', () => {
  it('petStatusLabel y sortPetsByName', () => {
    expect(petStatusLabel('ADOPTED')).toBe('Adoptada');
    expect(petStatusLabel(undefined)).toBe('Sin estado');
    const sorted = sortPetsByName([{ name: 'Zeus' }, { name: 'álamo' }, { name: 'Bruno' }]);
    expect(sorted.map((pet) => pet.name)).toEqual(['álamo', 'Bruno', 'Zeus']);
  });
});
