import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listMedicalRecords, listPetsInCharge } from '../src/js/api/medicalHistoryApi.js';
import { jsonResponse } from './helpers.js';

describe('medicalHistoryApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([])),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('listPetsInCharge consulta las mascotas del veterinario', async () => {
    await listPetsInCharge(3);
    expect(fetch.mock.calls[0][0]).toBe('/api/veterinarians/3/pets');
  });

  it('listMedicalRecords consulta el historial de la mascota del veterinario', async () => {
    await listMedicalRecords(3, 9);
    expect(fetch.mock.calls[0][0]).toBe('/api/veterinarians/3/pets/9/medical-records');
  });

  it('propaga el ApiError 403', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Prohibido' }, 403));
    await expect(listMedicalRecords(3, 9)).rejects.toMatchObject({ status: 403 });
  });
});
