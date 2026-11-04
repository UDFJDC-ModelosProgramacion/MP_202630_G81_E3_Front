import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { ACCESS_DENIED_TITLE, initMedicalHistoryPage } from '../src/js/pages/medicalHistoryPage.js';
import { until } from './helpers.js';

const PETS = [
  { id: 1, name: 'Luna', status: 'AVAILABLE' },
  { id: 2, name: 'Bruno', status: 'AVAILABLE' },
];
const RECORDS = [
  { id: 1, date: '2026-01-10', reason: 'Vacuna', diagnosis: 'Sano', treatment: 'Ninguno' },
  { id: 2, date: '2026-05-02', reason: 'Tos', diagnosis: 'Resfriado', treatment: 'Reposo' },
];

function buildApi(overrides = {}) {
  return {
    listPetsInCharge: vi.fn(async () => PETS),
    listMedicalRecords: vi.fn(async () => RECORDS),
    ...overrides,
  };
}
async function open(api, search, navigate = vi.fn()) {
  await initMedicalHistoryPage(document, { api, search, navigate });
  return navigate;
}
const stateTitle = () => document.querySelector('.state__title')?.textContent;

describe('página de historial médico', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada sin contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initMedicalHistoryPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it('sin veterinario en la URL pide abrirla desde el perfil', async () => {
    const api = buildApi();
    await open(api, '');
    expect(stateTitle()).toBe('Falta el veterinario');
    expect(api.listPetsInCharge).not.toHaveBeenCalled();
  });

  it('muestra el buscador con las mascotas a cargo y marca la página actual', async () => {
    await open(buildApi(), '?veterinarian=3');
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Historial médico');
    expect(document.querySelectorAll('li a')).toHaveLength(2);
  });

  it('muestra el historial más reciente primero con la información registrada', async () => {
    const api = buildApi();
    await open(api, '?veterinarian=3&pet=1');
    expect(api.listMedicalRecords).toHaveBeenCalledWith('3', '1');
    expect(document.querySelector('h1').textContent).toBe('Historial médico de Luna');
    const cards = [...document.querySelectorAll('li.card')];
    expect(cards[0].textContent).toContain('Resfriado');
    expect(cards[1].textContent).toContain('Vacuna');
  });

  it('una mascota sin registros muestra que no existen registros médicos', async () => {
    await open(buildApi({ listMedicalRecords: vi.fn(async () => []) }), '?veterinarian=3&pet=1');
    expect(stateTitle()).toBe('No existen registros médicos disponibles');
  });

  it('una mascota que no está a su cargo se deniega sin consultar el historial', async () => {
    const api = buildApi();
    const navigate = await open(api, '?veterinarian=3&pet=99');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
    expect(api.listMedicalRecords).not.toHaveBeenCalled();
    document.querySelector('.state button').click();
    expect(navigate).toHaveBeenCalledWith('medical-history.html?veterinarian=3');
  });

  it('si el back responde 403 no deja datos privados en pantalla', async () => {
    const listMedicalRecords = vi.fn(async () => {
      throw new ApiError('Prohibido', { status: 403 });
    });
    await open(buildApi({ listMedicalRecords }), '?veterinarian=3&pet=1');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
    expect(document.body.textContent).not.toContain('Resfriado');
    expect(document.body.textContent).not.toContain('Luna');
  });

  it('un id de mascota no numérico se deniega', async () => {
    await open(buildApi(), '?veterinarian=3&pet=abc');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
  });

  it('un veterinario inexistente (404) se deniega', async () => {
    const listPetsInCharge = vi.fn(async () => {
      throw new ApiError('no', { status: 404 });
    });
    await open(buildApi({ listPetsInCharge }), '?veterinarian=3');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
  });

  it('un error del servidor permite reintentar', async () => {
    const listMedicalRecords = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('x', { status: 500 }))
      .mockResolvedValue(RECORDS);
    await open(buildApi({ listMedicalRecords }), '?veterinarian=3&pet=1');
    expect(stateTitle()).toBe('No pudimos cargar el historial médico');
    document.querySelector('.state button').click();
    await until(() => document.querySelector('li.card'));
  });

  it('un error al cargar las mascotas permite reintentar', async () => {
    const listPetsInCharge = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('x', { status: 500 }))
      .mockResolvedValue(PETS);
    await open(buildApi({ listPetsInCharge }), '?veterinarian=3');
    expect(stateTitle()).toBe('No pudimos cargar tus mascotas');
    document.querySelector('.state button').click();
    await until(() => document.querySelector('li a'));
  });
});
