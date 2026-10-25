import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/js/utils/format.js';

describe('formatDate', () => {
  it('formatea fechas yyyy-mm-dd sin corrimiento de zona horaria', () => {
    expect(formatDate('2025-03-12')).toBe('12 mar 2025');
    expect(formatDate('2025-01-01')).toBe('1 ene 2025');
  });

  it('acepta fechas ISO con hora', () => {
    expect(formatDate('2025-12-31T23:59:59.000+00:00')).toBe('31 dic 2025');
  });

  it('acepta milisegundos', () => {
    expect(formatDate(Date.UTC(2025, 8, 14))).toBe('14 sep 2025');
  });

  it.each([null, undefined, '', 'ayer', '2025-13-01', {}])('valor inválido (%s)', (input) => {
    expect(formatDate(input)).toBe('Fecha no disponible');
  });
});
