import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/contract.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';
const CONTRACT = {
  id: 3,
  signedDate: '2026-03-16T00:00:00.000+00:00',
  termsAndConditions: 'El adoptante se compromete a brindar alimento y espacio adecuado.',
};

describe('init (página del contrato)', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta el encabezado y muestra el contrato indicado en la URL', async () => {
    fetch.mockResolvedValue(jsonResponse(CONTRACT));

    await init(document, '?contract=3');

    expect(document.querySelector('.brand__name')).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoption-contracts/3',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(document.querySelector('h1').textContent).toBe('Contrato de adopción');
    expect(document.querySelector('time').textContent).toBe('16 de marzo de 2026');
    expect(document.querySelector('.contract__terms').textContent).toContain(
      'brindar alimento y espacio adecuado',
    );
  });

  it('muestra el contrato de una adopción indicada en la URL', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 7, contract: CONTRACT }));

    await init(document, '?adoption=7');

    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/7');
    expect(document.querySelector('.contract')).not.toBeNull();
  });

  it('prefiere el contrato cuando la URL trae ambos parámetros', async () => {
    fetch.mockResolvedValue(jsonResponse(CONTRACT));

    await init(document, '?adoption=7&contract=3');

    expect(fetch.mock.calls[0][0]).toBe('/api/adoption-contracts/3');
  });

  it('muestra el estado vacío cuando la adopción no tiene contrato', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 7, contract: null }));

    await init(document, '?adoption=7');

    expect(document.querySelector('.contract')).toBeNull();
    expect(document.querySelector('.state__title').textContent).toBe(
      'Esta adopción aún no tiene contrato',
    );
  });

  it.each(['', '?contract=abc', '?contract=', '?adoption=x', '?otro=1'])(
    'sin un id válido en la URL (%s) no consulta al back',
    async (search) => {
      await init(document, search);

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Falta el contrato');
    },
  );

  it('muestra el error de carga y permite reintentar', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetch.mockResolvedValue(jsonResponse(CONTRACT));

    await init(document, '?contract=3');

    const alert = document.querySelector('.state--error');
    expect(alert.textContent).toContain('No pudimos cargar el contrato');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

    alert.querySelector('button').click();

    await until(() => document.querySelector('.contract') !== null);
    expect(document.querySelector('.state--error')).toBeNull();
  });

  it('muestra el mensaje del back cuando el contrato no existe', async () => {
    fetch.mockResolvedValue(
      jsonResponse(
        { apierror: { message: 'El contrato de adopción con ID 99 no fue encontrado.' } },
        404,
      ),
    );

    await init(document, '?contract=99');

    expect(document.querySelector('.state--error').textContent).toContain(
      'El contrato de adopción con ID 99 no fue encontrado.',
    );
  });

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document, '?contract=3')).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
