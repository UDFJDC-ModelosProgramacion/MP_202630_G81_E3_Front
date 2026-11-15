import { describe, expect, it } from 'vitest';
import {
  DATE_BEFORE_ADOPTION_MESSAGE,
  REASON_MAX_LENGTH,
  validateDevolution,
} from '../src/js/domain/devolution.js';

const ADOPTION_DATE = '2026-09-01';
const VALID = { date: '2026-09-15', reason: 'El adoptante cambió de ciudad.' };

describe('validateDevolution', () => {
  it('no reporta errores con datos válidos', () => {
    expect(validateDevolution(VALID, ADOPTION_DATE)).toEqual({});
  });

  it('indica cada campo obligatorio que falta', () => {
    expect(validateDevolution({ date: '', reason: '' }, ADOPTION_DATE)).toEqual({
      date: 'La fecha de la devolución es obligatoria.',
      reason: 'El motivo de la devolución es obligatorio.',
    });
  });

  it('rechaza fechas inexistentes o con otro formato', () => {
    for (const date of ['2026-02-31', '15/09/2026', 'ayer']) {
      expect(validateDevolution({ ...VALID, date }, ADOPTION_DATE).date).toBe(
        'La fecha de la devolución no es válida.',
      );
    }
  });

  it('rechaza una fecha anterior a la de la adopción', () => {
    const errors = validateDevolution({ ...VALID, date: '2026-08-31' }, ADOPTION_DATE);
    expect(errors.date).toBe(DATE_BEFORE_ADOPTION_MESSAGE);
    expect(DATE_BEFORE_ADOPTION_MESSAGE).toBe(
      'La fecha de la devolución no puede ser anterior a la fecha de la adopción',
    );
  });

  it('permite la misma fecha de la adopción', () => {
    expect(validateDevolution({ ...VALID, date: ADOPTION_DATE }, ADOPTION_DATE)).toEqual({});
  });

  it('acepta la fecha de adopción con hora y sin comparar si no la conoce', () => {
    expect(validateDevolution({ ...VALID, date: '2026-09-01' }, '2026-09-01T10:00:00')).toEqual({});
    expect(validateDevolution({ ...VALID, date: '2000-01-01' }, undefined)).toEqual({});
  });

  it('acepta un motivo del largo máximo y rechaza uno más largo', () => {
    const limit = 'a'.repeat(REASON_MAX_LENGTH);
    expect(validateDevolution({ ...VALID, reason: limit }, ADOPTION_DATE)).toEqual({});
    expect(validateDevolution({ ...VALID, reason: `${limit}a` }, ADOPTION_DATE).reason).toContain(
      String(REASON_MAX_LENGTH),
    );
  });
});
