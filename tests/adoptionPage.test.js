import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/adoption.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';
const ADOPTION = {
  id: 7,
  adoptionDate: '2026-03-16',
  status: 'COMPLETED',
  contract: null,
  requirements: [{ id: 1, description: 'Tener patio cerrado.', isMandatory: true }],
};

describe('init (página del proceso de adopción)', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta el encabezado y muestra la adopción indicada en la URL', async () => {
    fetch.mockResolvedValue(jsonResponse(ADOPTION));

    await init(document, '?adoption=7');

    expect(document.querySelector('.brand__name')).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoptions/7',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(document.querySelector('h1').textContent).toBe('Proceso de adopción');
    expect(document.querySelector('.process__status').textContent).toBe('Completada');
    expect(document.querySelectorAll('.process-requirement')).toHaveLength(1);
  });

  it.each(['', '?adoption=abc', '?adoption=', '?otro=1'])(
    'sin un id válido en la URL (%s) no consulta al back',
    async (search) => {
      await init(document, search);

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Falta la adopción');
    },
  );

  it('muestra un aviso cuando el back no devuelve la adopción', async () => {
    fetch.mockResolvedValue(jsonResponse(null, 204));

    await init(document, '?adoption=7');

    expect(document.querySelector('.process')).toBeNull();
    expect(document.querySelector('.state__title').textContent).toBe('No encontramos la adopción');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetch.mockResolvedValue(jsonResponse(ADOPTION));

    await init(document, '?adoption=7');

    const alert = document.querySelector('.state--error');
    expect(alert.textContent).toContain('No pudimos cargar la adopción');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

    alert.querySelector('button').click();

    await until(() => document.querySelector('.process') !== null);
    expect(document.querySelector('.state--error')).toBeNull();
  });

  it('muestra el mensaje del back cuando la adopción no existe', async () => {
    fetch.mockResolvedValue(
      jsonResponse({ apierror: { message: 'La adopción con ID 99 no fue encontrada.' } }, 404),
    );

    await init(document, '?adoption=99');

    expect(document.querySelector('.state--error').textContent).toContain(
      'La adopción con ID 99 no fue encontrada.',
    );
  });

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document, '?adoption=7')).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
