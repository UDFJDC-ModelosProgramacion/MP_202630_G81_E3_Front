import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import {
  ACCESS_DENIED_TITLE,
  initAdministratorSheltersPage,
} from '../src/js/pages/administratorSheltersPage.js';

const SHELTERS = [
  { id: 1, name: 'Huellitas', city: 'Bogotá', pets: [{ id: 1, name: 'Luna', status: 'AVAILABLE' }] },
  { id: 2, name: 'Patitas', city: 'Medellín', pets: [] },
];
const NOT_ASSOCIATED_MESSAGE = 'El refugio no está asociado con el administrador dado';
const NOT_LINKED_MESSAGE = 'El administrador no está asociado con este refugio';

function buildApi(overrides = {}) {
  return {
    listShelters: vi.fn().mockResolvedValue(SHELTERS),
    getShelter: vi.fn().mockResolvedValue(SHELTERS[0]),
    unlinkShelter: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

async function open(api, search = '?administrator=3', confirmAction = () => true) {
  const navigate = vi.fn();
  await initAdministratorSheltersPage(document, { api, search, navigate, confirmAction });
  return navigate;
}

const cardNames = () => [...document.querySelectorAll('.card-title')].map((n) => n.textContent);
const stateTitle = () => document.querySelector('.state__title')?.textContent;
const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';

describe('página de refugios del administrador', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada sin contenedor', async () => {
    document.body.innerHTML = '';
    await expect(
      initAdministratorSheltersPage(document, { api: buildApi() }),
    ).resolves.toBeUndefined();
  });

  it.each(['', '?administrator=abc', '?administrator=', '?shelter=1'])(
    'sin un administrador válido en la URL (%s) no consulta al back',
    async (search) => {
      const api = buildApi();

      await open(api, search);

      expect(api.listShelters).not.toHaveBeenCalled();
      expect(stateTitle()).toBe('Falta el administrador');
    },
  );

  describe('mis refugios', () => {
    it('muestra los refugios del administrador con nombre, ciudad y mascotas', async () => {
      const api = buildApi();

      await open(api);

      expect(api.listShelters).toHaveBeenCalledWith('3');
      expect(document.querySelector('.brand__name')).not.toBeNull();
      expect(document.querySelector('h1').textContent).toBe('Mis refugios');
      expect(cardNames()).toEqual(['Huellitas', 'Patitas']);
      expect(document.querySelector('.card .badge').textContent).toBe('1 mascota');
    });

    it('sin refugios asignados lo informa', async () => {
      await open(buildApi({ listShelters: vi.fn().mockResolvedValue([]) }));

      expect(stateTitle()).toBe('Aún no tienes refugios asignados');
    });

    it('muestra el error de carga y permite reintentar', async () => {
      const api = buildApi({
        listShelters: vi
          .fn()
          .mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
          .mockResolvedValue(SHELTERS),
      });
      await open(api);

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar tus refugios');

      alert.querySelector('button').click();

      await vi.waitFor(() => expect(cardNames()).toHaveLength(2));
    });
  });

  describe('desvincular', () => {
    it('tras confirmar elimina la asociación y el refugio deja de aparecer', async () => {
      const api = buildApi({
        listShelters: vi.fn().mockResolvedValueOnce(SHELTERS).mockResolvedValue([SHELTERS[1]]),
      });
      await open(api);

      document.querySelector('.btn-outline-danger').click();

      await vi.waitFor(() => expect(cardNames()).toEqual(['Patitas']));
      expect(api.unlinkShelter).toHaveBeenCalledWith('3', 1);
      expect(feedbackText()).toContain('Te desvinculaste de Huellitas.');
    });

    it('no hace nada si el usuario cancela la confirmación', async () => {
      const api = buildApi();
      await open(api, '?administrator=3', () => false);

      document.querySelector('.btn-outline-danger').click();

      expect(api.unlinkShelter).not.toHaveBeenCalled();
      expect(cardNames()).toEqual(['Huellitas', 'Patitas']);
    });

    it('si no estaban asociados muestra el mensaje del back y actualiza el listado', async () => {
      const api = buildApi({
        unlinkShelter: vi
          .fn()
          .mockRejectedValue(new ApiError(NOT_LINKED_MESSAGE, { status: 412 })),
      });
      await open(api);

      document.querySelector('.btn-outline-danger').click();

      await vi.waitFor(() => expect(feedbackText()).toContain(NOT_LINKED_MESSAGE));
      expect(document.querySelector('.alert-danger')).not.toBeNull();
      await vi.waitFor(() => expect(api.listShelters).toHaveBeenCalledTimes(2));
    });
  });

  describe('información de un refugio', () => {
    it('muestra el refugio asociado al administrador', async () => {
      const api = buildApi();

      await open(api, '?administrator=3&shelter=1');

      expect(api.getShelter).toHaveBeenCalledWith('3', '1');
      expect(document.querySelector('h1').textContent).toBe('Huellitas');
      expect(document.querySelector('section.card').textContent).toContain('Luna');
      expect(document.querySelector('a.btn').getAttribute('href')).toBe(
        'administrator-shelters.html?administrator=3',
      );
    });

    it('si el refugio no está asociado deniega el acceso con el mensaje del back', async () => {
      const api = buildApi({
        getShelter: vi
          .fn()
          .mockRejectedValue(new ApiError(NOT_ASSOCIATED_MESSAGE, { status: 412 })),
      });

      const navigate = await open(api, '?administrator=3&shelter=9');

      expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
      expect(document.querySelector('.state__text').textContent).toBe(NOT_ASSOCIATED_MESSAGE);
      document.querySelector('.state button').click();
      expect(navigate).toHaveBeenCalledWith('administrator-shelters.html?administrator=3');
    });

    it('si el refugio o el administrador no existen (404) lo informa', async () => {
      const api = buildApi({
        getShelter: vi.fn().mockRejectedValue(new ApiError('Refugio no encontrado', { status: 404 })),
      });

      await open(api, '?administrator=3&shelter=0');

      expect(stateTitle()).toBe('No encontrado');
      expect(document.querySelector('.state__text').textContent).toBe('Refugio no encontrado');
    });

    it('con un id de refugio inválido no consulta al back', async () => {
      const api = buildApi();

      await open(api, '?administrator=3&shelter=abc');

      expect(api.getShelter).not.toHaveBeenCalled();
      expect(stateTitle()).toBe('No encontrado');
    });

    it('ante un error del servidor muestra el error y permite reintentar', async () => {
      const api = buildApi({
        getShelter: vi
          .fn()
          .mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
          .mockResolvedValue(SHELTERS[0]),
      });
      await open(api, '?administrator=3&shelter=1');

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar el refugio');

      alert.querySelector('button').click();

      await vi.waitFor(() => expect(document.querySelector('h1').textContent).toBe('Huellitas'));
    });
  });
});
