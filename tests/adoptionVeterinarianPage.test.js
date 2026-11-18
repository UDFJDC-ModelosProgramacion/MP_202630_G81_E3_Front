import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initAdoptionVeterinarianPage } from '../src/js/pages/adoptionVeterinarianPage.js';

const PET = { id: 2, name: 'Max', shelter: { id: 1, name: 'Huellas', city: 'Bogotá' } };
const ADOPTER = { id: 3, name: 'Carlos Pérez' };
const LAURA = {
  id: 5,
  name: 'Laura Ruiz',
  speciality: 'Medicina general',
  age: 35,
  gender: 'FEMALE',
  available: true,
};
const ANDRES = {
  id: 6,
  name: 'Andrés Mora',
  speciality: 'Cirugía',
  age: 42,
  gender: 'MALE',
  available: false,
};

const adoptionWith = (overrides = {}) => ({
  id: 7,
  status: 'IN_PROGRESS',
  adoptionDate: '2026-10-01',
  pet: PET,
  adopter: ADOPTER,
  veterinarian: null,
  ...overrides,
});

function buildApi(overrides = {}) {
  return {
    getAdoption: vi.fn().mockResolvedValue(adoptionWith()),
    listShelterVeterinarians: vi.fn().mockResolvedValue([LAURA, ANDRES]),
    assignVeterinarian: vi.fn().mockResolvedValue(LAURA),
    removeVeterinarian: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const openPage = (api, { search = '?adoption=7', confirmAction = () => true } = {}) =>
  initAdoptionVeterinarianPage(document, { api, search, confirmAction });

const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';
const assignButtons = () => [...document.querySelectorAll('li button')];

describe('página del veterinario de la adopción', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(openPage(buildApi())).resolves.toBeUndefined();
  });

  it.each(['', '?adoption=abc', '?otro=1'])(
    'sin adopción válida (%s) no consulta al back',
    async (search) => {
      const api = buildApi();
      await openPage(api, { search });

      expect(api.getAdoption).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Falta la adopción');
    },
  );

  it('muestra la adopción y los veterinarios de su refugio con su disponibilidad', async () => {
    const api = buildApi();
    await openPage(api);

    expect(api.listShelterVeterinarians).toHaveBeenCalledWith(1);
    const info = document.querySelector('#adoption-info-title').closest('section').textContent;
    expect(info).toContain('Max');
    expect(info).toContain('Carlos Pérez');
    expect(info).toContain('En proceso');
    const rows = document.querySelectorAll('li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Disponible');
    expect(rows[1].textContent).toContain('En proceso de adopción');
  });

  it('solo permite asignar a los veterinarios disponibles', async () => {
    await openPage(buildApi());

    const [laura, andres] = assignButtons();
    expect(laura.disabled).toBe(false);
    expect(andres.disabled).toBe(true);
  });

  it('asigna el veterinario elegido y recarga la adopción', async () => {
    const api = buildApi({
      getAdoption: vi
        .fn()
        .mockResolvedValueOnce(adoptionWith())
        .mockResolvedValue(adoptionWith({ veterinarian: LAURA })),
    });
    await openPage(api);

    assignButtons()[0].click();

    await vi.waitFor(() => expect(feedbackText()).toContain('Laura Ruiz ahora acompaña'));
    expect(api.assignVeterinarian).toHaveBeenCalledWith('7', 5);
    expect(document.querySelector('#adoption-vet-title').textContent).toBe('Veterinario asignado');
    expect(api.listShelterVeterinarians).toHaveBeenCalledTimes(1);
  });

  it('muestra el error del back al asignar y vuelve a cargar la lista', async () => {
    const api = buildApi({
      assignVeterinarian: vi
        .fn()
        .mockRejectedValue(new ApiError('El veterinario no está disponible', { status: 412 })),
    });
    await openPage(api);

    assignButtons()[0].click();

    await vi.waitFor(() => expect(feedbackText()).toContain('El veterinario no está disponible'));
    await vi.waitFor(() => expect(api.getAdoption).toHaveBeenCalledTimes(2));
  });

  it('con veterinario asignado lo muestra con enlace al historial y sin pedir candidatos', async () => {
    const api = buildApi({
      getAdoption: vi.fn().mockResolvedValue(adoptionWith({ veterinarian: LAURA })),
    });
    await openPage(api);

    const section = document.querySelector('#adoption-vet-title').closest('section');
    expect(section.textContent).toContain('Laura Ruiz');
    expect(section.textContent).toContain('35 años · Femenino');
    expect(section.querySelector('a').getAttribute('href')).toBe(
      'medical-history.html?veterinarian=5',
    );
    expect(api.listShelterVeterinarians).not.toHaveBeenCalled();
  });

  it('quita el veterinario tras confirmar', async () => {
    const api = buildApi({
      getAdoption: vi
        .fn()
        .mockResolvedValueOnce(adoptionWith({ veterinarian: LAURA }))
        .mockResolvedValue(adoptionWith()),
    });
    await openPage(api);

    document.querySelector('button.btn-outline-danger').click();

    await vi.waitFor(() => expect(feedbackText()).toContain('Veterinario quitado'));
    expect(api.removeVeterinarian).toHaveBeenCalledWith('7');
  });

  it('no quita el veterinario si el usuario cancela', async () => {
    const api = buildApi({
      getAdoption: vi.fn().mockResolvedValue(adoptionWith({ veterinarian: LAURA })),
    });
    await openPage(api, { confirmAction: () => false });

    document.querySelector('button.btn-outline-danger').click();

    expect(api.removeVeterinarian).not.toHaveBeenCalled();
  });

  it('muestra el error del back al quitar', async () => {
    const api = buildApi({
      getAdoption: vi.fn().mockResolvedValue(adoptionWith({ veterinarian: LAURA })),
      removeVeterinarian: vi
        .fn()
        .mockRejectedValue(new ApiError('Sin veterinario', { status: 404 })),
    });
    await openPage(api);

    document.querySelector('button.btn-outline-danger').click();

    await vi.waitFor(() => expect(feedbackText()).toContain('Sin veterinario'));
  });

  it('en una adopción terminada explica por qué no se puede asignar', async () => {
    const api = buildApi({
      getAdoption: vi.fn().mockResolvedValue(adoptionWith({ status: 'COMPLETED' })),
    });
    await openPage(api);

    expect(document.querySelector('#adoption-vet-title').closest('section').textContent).toContain(
      'Solo se puede asignar un veterinario a una adopción en proceso o en convivencia.',
    );
    expect(api.listShelterVeterinarians).not.toHaveBeenCalled();
  });

  it('avisa si la mascota no tiene refugio', async () => {
    const api = buildApi({
      getAdoption: vi.fn().mockResolvedValue(adoptionWith({ pet: { id: 2, name: 'Max' } })),
    });
    await openPage(api);

    expect(document.querySelector('#adoption-vet-title').closest('section').textContent).toContain(
      'no tiene refugio',
    );
  });

  it('sugiere registrar veterinarios si el refugio no tiene ninguno', async () => {
    const api = buildApi({ listShelterVeterinarians: vi.fn().mockResolvedValue([]) });
    await openPage(api);

    const link = document
      .querySelector('#adoption-vet-title')
      .closest('section')
      .querySelector('a');
    expect(link.getAttribute('href')).toBe('veterinarios.html');
  });

  it('muestra un aviso cuando el back no devuelve la adopción', async () => {
    await openPage(buildApi({ getAdoption: vi.fn().mockResolvedValue(null) }));

    expect(document.querySelector('.state__title').textContent).toBe('No encontramos la adopción');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const getAdoption = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Sin conexión', { status: 0 }))
      .mockResolvedValue(adoptionWith());
    await openPage(buildApi({ getAdoption }));

    expect(document.querySelector('.state--error')).not.toBeNull();
    document.querySelector('.state--error button').click();
    await vi.waitFor(() => expect(document.querySelectorAll('li')).toHaveLength(2));
  });
});
