import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { NOT_FOUND_TITLE, initSheltersPage } from '../src/js/pages/sheltersPage.js';

const SHELTERS = [
  { id: 1, name: 'Huellitas', city: 'Bogotá', pets: [{ id: 1, name: 'Luna', status: 'AVAILABLE' }] },
  { id: 2, name: 'Patitas', city: 'Medellín', pets: [] },
  { id: 3, name: 'Colitas', city: 'Bogotá', pets: [] },
];

function buildApi(overrides = {}) {
  return {
    listShelters: vi.fn(async ({ city } = {}) =>
      SHELTERS.filter((shelter) => !city || shelter.city === city),
    ),
    getShelter: vi.fn(async (id) => SHELTERS.find((shelter) => String(shelter.id) === id)),
    ...overrides,
  };
}

async function openPage(api, search = '', navigate = vi.fn()) {
  await initSheltersPage(document, { api, search, navigate });
  return navigate;
}

const cardNames = () => [...document.querySelectorAll('.card-title')].map((n) => n.textContent);
const stateTitle = () => document.querySelector('.state__title').textContent;

function filterBy(city) {
  document.querySelector('#shelter-city').value = city;
  document
    .querySelector('#shelter-filter-form')
    .dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('página de refugios', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initSheltersPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  describe('listado', () => {
    it('marca la página actual y muestra todos los refugios sin filtrar', async () => {
      const api = buildApi();

      await openPage(api);

      expect(document.querySelector('[aria-current="page"]').textContent).toBe('Refugios');
      expect(api.listShelters).toHaveBeenCalledWith({ city: '' });
      expect(cardNames()).toEqual(['Huellitas', 'Patitas', 'Colitas']);
      expect(document.querySelector('.card .badge').textContent).toBe('1 mascota');
    });

    it('ofrece las ciudades registradas como sugerencias del filtro', async () => {
      await openPage(buildApi());

      const options = [...document.querySelectorAll('datalist option')].map((o) => o.value);
      expect(options).toEqual(['Bogotá', 'Medellín']);
    });

    it('muestra el estado vacío cuando no hay refugios', async () => {
      await openPage(buildApi({ listShelters: vi.fn().mockResolvedValue([]) }));

      expect(stateTitle()).toBe('Aún no hay refugios');
    });
  });

  describe('filtro por ciudad', () => {
    it('muestra únicamente los refugios de la ciudad elegida', async () => {
      const api = buildApi();
      await openPage(api);

      filterBy('Bogotá');

      await vi.waitFor(() => expect(cardNames()).toEqual(['Huellitas', 'Colitas']));
      expect(api.listShelters).toHaveBeenLastCalledWith({ city: 'Bogotá' });
      expect(document.querySelector('#shelter-city').value).toBe('Bogotá');
    });

    it('conserva las ciudades sugeridas tras filtrar', async () => {
      await openPage(buildApi());

      filterBy('Bogotá');

      await vi.waitFor(() => expect(cardNames()).toHaveLength(2));
      expect(document.querySelectorAll('datalist option')).toHaveLength(2);
    });

    it('en una ciudad sin refugios avisa y permite ver todos', async () => {
      await openPage(buildApi());

      filterBy('Cali');

      await vi.waitFor(() => expect(stateTitle()).toBe('No hay refugios en Cali'));
      expect(document.querySelector('.state').textContent).toContain(
        'No hay refugios registrados en esa ciudad.',
      );

      document.querySelector('.state button').click();

      await vi.waitFor(() => expect(cardNames()).toHaveLength(3));
      expect(document.querySelector('#shelter-city').value).toBe('');
    });

    it('el botón Ver todos del filtro restaura el listado', async () => {
      await openPage(buildApi());
      filterBy('Medellín');
      await vi.waitFor(() => expect(cardNames()).toEqual(['Patitas']));

      document.querySelector('.btn-outline-secondary').click();

      await vi.waitFor(() => expect(cardNames()).toHaveLength(3));
    });
  });

  describe('errores del listado', () => {
    it('muestra el error de carga y permite reintentar', async () => {
      const api = buildApi({
        listShelters: vi
          .fn()
          .mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', { status: 0 }))
          .mockResolvedValue(SHELTERS),
      });
      await openPage(api);

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar los refugios');
      expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

      alert.querySelector('button').click();

      await vi.waitFor(() => expect(cardNames()).toHaveLength(3));
    });
  });

  describe('detalle', () => {
    it('muestra la información del refugio indicado en la URL', async () => {
      const api = buildApi();

      await openPage(api, '?id=1');

      expect(api.getShelter).toHaveBeenCalledWith('1');
      expect(document.querySelector('h1').textContent).toBe('Huellitas');
      expect(document.querySelector('section.card').textContent).toContain('Luna');
    });

    it('si el refugio no existe (404) muestra "Refugio no encontrado"', async () => {
      const api = buildApi({
        getShelter: vi.fn().mockRejectedValue(new ApiError('Refugio no encontrado', { status: 404 })),
      });

      const navigate = await openPage(api, '?id=0');

      expect(stateTitle()).toBe(NOT_FOUND_TITLE);
      expect(NOT_FOUND_TITLE).toBe('Refugio no encontrado');
      document.querySelector('.state button').click();
      expect(navigate).toHaveBeenCalledWith('shelters.html');
    });

    it.each(['?id=abc', '?id='])('con un id inválido (%s) no consulta al back', async (search) => {
      const api = buildApi();

      await openPage(api, search);

      expect(api.getShelter).not.toHaveBeenCalled();
      expect(stateTitle()).toBe(NOT_FOUND_TITLE);
    });

    it('ante un error del servidor muestra el error y permite reintentar', async () => {
      const api = buildApi({
        getShelter: vi
          .fn()
          .mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
          .mockResolvedValue(SHELTERS[0]),
      });
      await openPage(api, '?id=1');

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar el refugio');

      alert.querySelector('button').click();

      await vi.waitFor(() => expect(document.querySelector('h1').textContent).toBe('Huellitas'));
    });
  });
});
