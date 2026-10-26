import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { associateShelters, summarizeAssociation } from '../src/js/services/administratorService.js';

const ALREADY_ASSOCIATED = 'El administrador ya está asociado con este refugio';
const shelterNameOf = (id) => `Refugio ${id}`;

describe('associateShelters', () => {
  it('asocia cada refugio en el orden recibido', async () => {
    const associate = vi.fn().mockResolvedValue({});

    const result = await associateShelters(associate, 1, [10, 20]);

    expect(associate.mock.calls).toEqual([
      [1, 10],
      [1, 20],
    ]);
    expect(result).toEqual({ associated: [10, 20], failures: [] });
  });

  it('continúa tras un fallo y reporta el mensaje del back', async () => {
    const associate = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(ALREADY_ASSOCIATED, { status: 412 }))
      .mockResolvedValueOnce({});

    const result = await associateShelters(associate, 1, [10, 20]);

    expect(result.associated).toEqual([20]);
    expect(result.failures).toEqual([{ shelterId: 10, message: ALREADY_ASSOCIATED }]);
  });
});

describe('summarizeAssociation', () => {
  it('es exitoso cuando no hay fallos', () => {
    const summary = summarizeAssociation('Marta', { associated: [1, 2], failures: [] }, shelterNameOf);
    expect(summary).toEqual({
      kind: 'success',
      message: 'Refugios asociados a Marta: 2.',
      details: [],
    });
  });

  it('es un error cuando todo falla y detalla cada refugio', () => {
    const failures = [{ shelterId: 1, message: ALREADY_ASSOCIATED }];
    const summary = summarizeAssociation('Marta', { associated: [], failures }, shelterNameOf);
    expect(summary.kind).toBe('danger');
    expect(summary.details).toEqual([`Refugio 1: ${ALREADY_ASSOCIATED}`]);
  });

  it('es una advertencia cuando el resultado es parcial', () => {
    const failures = [{ shelterId: 1, message: ALREADY_ASSOCIATED }];
    const summary = summarizeAssociation('Marta', { associated: [2], failures }, shelterNameOf);
    expect(summary.kind).toBe('warning');
  });
});
