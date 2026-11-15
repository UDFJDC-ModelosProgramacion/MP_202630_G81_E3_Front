import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initPetManagementPage } from '../src/js/pages/petManagementPage.js';
import { until } from './helpers.js';

const SHELTERS = [{ id: 4, name: 'Huellitas', city: 'Bogotá' }];
const LUNA = {
  id: 1,
  name: 'Luna',
  status: 'AVAILABLE',
  age: 3,
  sex: 'Hembra',
  size: 'Tamaño mediano',
  photos: ['luna.png'],
  shelter: { id: 4, name: 'Huellitas' },
};

function buildApi(overrides = {}) {
  let pets = [LUNA];
  return {
    listPets: vi.fn(async () => pets),
    listShelters: vi.fn(async () => SHELTERS),
    createPet: vi.fn(async (body) => {
      pets = [...pets, { id: 2, ...body, shelter: { id: 4, name: 'Huellitas' } }];
      return pets.at(-1);
    }),
    updatePet: vi.fn(async (id, body) => {
      pets = pets.map((pet) => (pet.id === id ? { ...pet, ...body } : pet));
      return pets.find((pet) => pet.id === id);
    }),
    ...overrides,
  };
}

const rowNames = () => [...document.querySelectorAll('tbody th')].map((n) => n.textContent);
const set = (name, value) => {
  document.querySelector(`#pet-${name}`).value = value;
};
const submit = () =>
  document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

describe('página de gestión de mascotas', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada sin contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initPetManagementPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it('lista las mascotas registradas y marca la página actual', async () => {
    await initPetManagementPage(document, { api: buildApi() });
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Gestión de mascotas');
    expect(rowNames()).toEqual(['Luna']);
    expect(document.querySelector('tbody .badge').textContent).toBe('Disponible');
  });

  it('el error al cargar permite reintentar', async () => {
    const listPets = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('x', { status: 500 }))
      .mockResolvedValue([LUNA]);
    await initPetManagementPage(document, { api: buildApi({ listPets }) });
    expect(document.querySelector('.state__title').textContent).toBe(
      'No pudimos cargar las mascotas',
    );
    document.querySelector('.state button').click();
    await until(() => document.querySelector('tbody'));
  });

  it('registra una mascota, muestra la confirmación y la agrega al listado', async () => {
    const api = buildApi();
    await initPetManagementPage(document, { api });
    set('name', 'Bruno');
    set('age', '2');
    set('sex', 'Macho');
    set('size', 'Tamaño grande');
    set('shelterId', '4');
    set('arrivalDescription', 'Encontrado en la calle');
    submit();
    await until(() => document.querySelector('.alert-success'));
    expect(api.createPet).toHaveBeenCalledTimes(1);
    expect(api.createPet.mock.calls[0][0].events[0].eventType).toBe('ARRIVAL');
    expect(document.querySelector('.alert-success').textContent).toContain('Bruno');
    expect(rowNames()).toEqual(['Bruno', 'Luna']);
  });

  it('no registra si falta información', async () => {
    const api = buildApi();
    await initPetManagementPage(document, { api });
    submit();
    expect(api.createPet).not.toHaveBeenCalled();
    expect(document.querySelector('.is-invalid')).not.toBeNull();
  });

  it('actualiza una mascota y muestra la versión actualizada', async () => {
    const api = buildApi();
    await initPetManagementPage(document, { api });
    document.querySelector('tbody button').click();
    expect(document.querySelector('#pet-form-heading').textContent).toBe('Editar a Luna');
    expect(document.querySelector('#pet-name').value).toBe('Luna');
    set('name', 'Luna Plus');
    submit();
    await until(() => document.querySelector('.alert-success'));
    expect(api.updatePet).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: 'Luna Plus', photos: ['luna.png'], shelter: { id: 4 } }),
    );
    expect(rowNames()).toEqual(['Luna Plus']);
    expect(document.querySelector('#pet-form-heading').textContent).toBe('Registrar mascota');
  });

  it('cancelar la edición vuelve al formulario de registro', async () => {
    await initPetManagementPage(document, { api: buildApi() });
    document.querySelector('tbody button').click();
    document.querySelector('button[type="button"].btn-outline-secondary').click();
    expect(document.querySelector('#pet-form-heading').textContent).toBe('Registrar mascota');
  });

  it('muestra el error del servidor al guardar sin perder los datos', async () => {
    const createPet = vi.fn().mockRejectedValue(new ApiError('Name is not valid', { status: 412 }));
    await initPetManagementPage(document, { api: buildApi({ createPet }) });
    set('name', 'Bruno');
    set('age', '2');
    set('sex', 'Macho');
    set('size', 'Tamaño grande');
    set('shelterId', '4');
    set('arrivalDescription', 'x');
    submit();
    await until(() => document.querySelector('#pet-management-form .alert-danger:not([hidden])'));
    expect(document.querySelector('#pet-name').value).toBe('Bruno');
  });
});
