import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/adopters.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';
const ANA = { id: 1, name: 'Ana Pérez', phone: '3001234567' };

function backend(routes) {
  fetch.mockImplementation(async (url, init) => {
    const handler = routes[`${init.method} ${url}`];
    return handler ? handler() : jsonResponse({ apierror: { message: 'Adopter not found' } }, 404);
  });
}

describe('init (página de adoptantes)', () => {
  let navigate;

  beforeEach(() => {
    document.body.innerHTML = PAGE;
    navigate = vi.fn();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('listado', () => {
    it('muestra los adoptantes en tarjetas', async () => {
      backend({ 'GET /api/adopters': () => jsonResponse([ANA, { ...ANA, id: 2, name: 'Luis' }]) });

      await init(document, '', navigate);

      expect(document.querySelector('.brand__name')).not.toBeNull();
      expect(document.querySelector('h1').textContent).toBe('Adoptantes');
      expect(document.querySelectorAll('.adopter-card')).toHaveLength(2);
    });

    it('muestra el estado vacío', async () => {
      backend({ 'GET /api/adopters': () => jsonResponse([]) });

      await init(document, '', navigate);

      expect(document.querySelector('.state__title').textContent).toBe('Aún no hay adoptantes');
    });

    it('muestra el error de carga y permite reintentar', async () => {
      backend({ 'GET /api/adopters': () => jsonResponse([ANA]) });
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await init(document, '', navigate);

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar los adoptantes');
      alert.querySelector('button').click();

      await until(() => document.querySelectorAll('.adopter-card').length === 1);
    });
  });

  describe('perfil', () => {
    it('muestra el perfil con sus adopciones', async () => {
      backend({
        'GET /api/adopters/1': () =>
          jsonResponse({
            ...ANA,
            adoptions: [{ id: 10, adoptionDate: '2026-09-20', status: 'APROBADA' }],
          }),
      });

      await init(document, '?id=1', navigate);

      expect(document.querySelector('h1').textContent).toBe('Ana Pérez');
      expect(document.querySelector('.adoption-item').textContent).toContain('20/09/2026');
      expect(document.querySelector('.adoption-item').textContent).toContain('APROBADA');
    });

    it('sin adopciones muestra el mensaje indicado', async () => {
      backend({ 'GET /api/adopters/1': () => jsonResponse({ ...ANA, adoptions: [] }) });

      await init(document, '?id=1', navigate);

      expect(document.querySelector('.state--empty').textContent).toBe(
        'Este adoptante aún no tiene adopciones',
      );
    });

    it('si el adoptante no existe (404) muestra “Adoptante no encontrado”', async () => {
      backend({});

      await init(document, '?id=99', navigate);

      expect(document.querySelector('.state__title').textContent).toBe('Adoptante no encontrado');
      document.querySelector('.state button').click();
      expect(navigate).toHaveBeenCalledWith('adopters.html');
    });

    it.each(['?id=abc', '?id='])('con un id inválido (%s) no consulta al back', async (search) => {
      await init(document, search, navigate);

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Adoptante no encontrado');
    });

    it('ante un error del servidor muestra el error y permite reintentar', async () => {
      backend({ 'GET /api/adopters/1': () => jsonResponse({ ...ANA, adoptions: [] }) });
      fetch.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500));

      await init(document, '?id=1', navigate);

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar el perfil');
      alert.querySelector('button').click();

      await until(() => document.querySelector('h1')?.textContent === 'Ana Pérez');
    });

    it('elimina un adoptante sin adopciones y vuelve al listado', async () => {
      backend({
        'GET /api/adopters/1': () => jsonResponse({ ...ANA, adoptions: [] }),
        'DELETE /api/adopters/1': () => jsonResponse(null, 204),
      });
      await init(document, '?id=1', navigate);

      document.querySelector('.btn--danger').click();

      await until(() => navigate.mock.calls.length === 1);
      expect(navigate).toHaveBeenCalledWith('adopters.html');
    });

    it('con adopciones no llama al DELETE y explica el motivo', async () => {
      backend({
        'GET /api/adopters/1': () =>
          jsonResponse({ ...ANA, adoptions: [{ id: 10, status: 'APROBADA' }] }),
      });
      await init(document, '?id=1', navigate);

      document.querySelector('.btn--danger').click();

      expect(document.querySelector('.form-feedback').textContent).toContain('adopciones registradas');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('si el back rechaza el borrado muestra el motivo', async () => {
      backend({
        'GET /api/adopters/1': () => jsonResponse({ ...ANA, adoptions: [] }),
        'DELETE /api/adopters/1': () =>
          jsonResponse({ apierror: { message: 'Unable to delete' } }, 412),
      });
      await init(document, '?id=1', navigate);

      document.querySelector('.btn--danger').click();

      await until(() => document.querySelector('.form-feedback').textContent !== '');
      expect(document.querySelector('.form-feedback').textContent).toContain(
        'adopciones registradas',
      );
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document, '', navigate)).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
