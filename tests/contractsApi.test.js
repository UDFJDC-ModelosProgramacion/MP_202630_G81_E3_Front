import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdoptionContract, getContract } from '../src/js/api/contractsApi.js';
import { ApiError } from '../src/js/api/httpClient.js';
import { jsonResponse } from './helpers.js';

describe('contractsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getContract consulta el contrato por su id', async () => {
    const contract = { id: 4, termsAndConditions: 'Cuidar a la mascota', signedDate: '2026-03-16' };
    fetch.mockResolvedValue(jsonResponse(contract));

    await expect(getContract(4)).resolves.toEqual(contract);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoption-contracts/4',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('codifica el id en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getContract('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/adoption-contracts/a%2Fb');
  });

  it('getAdoptionContract devuelve el contrato incluido en la adopción', async () => {
    const contract = { id: 2, termsAndConditions: 'Términos', signedDate: '2026-03-16' };
    fetch.mockResolvedValue(jsonResponse({ id: 7, contract }));

    await expect(getAdoptionContract(7)).resolves.toEqual(contract);
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/7');
  });

  it.each([[{ id: 7, contract: null }], [{ id: 7 }], [null]])(
    'getAdoptionContract devuelve null si la adopción no tiene contrato (%j)',
    async (adoption) => {
      fetch.mockResolvedValue(adoption === null ? jsonResponse(null, 204) : jsonResponse(adoption));
      await expect(getAdoptionContract(7)).resolves.toBeNull();
    },
  );

  it('propaga el ApiError con el mensaje del back', async () => {
    fetch.mockResolvedValue(
      jsonResponse(
        { apierror: { message: 'El contrato de adopción con ID 9 no fue encontrado.' } },
        404,
      ),
    );

    const error = await getContract(9).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('El contrato de adopción con ID 9 no fue encontrado.');
  });
});
