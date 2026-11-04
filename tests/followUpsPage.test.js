import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { ACCESS_DENIED_TITLE, initFollowUpsPage } from '../src/js/pages/followUpsPage.js';
import { until } from './helpers.js';

const ADOPTER = {
  id: 2,
  adoptions: [
    { id: 7, status: 'COMPLETED', adoptionDate: '2026-09-20', pet: { name: 'Luna' } },
    { id: 8, status: 'CANCELLED', adoptionDate: '2026-09-21', pet: { name: 'Rocky' } },
  ],
};
const FOLLOW_UPS = [
  { id: 1, date: '2026-10-01', adaptationStatus: 'ADAPTING', observations: 'Antiguo' },
  { id: 2, date: '2026-10-20', adaptationStatus: 'GOOD', observations: 'Reciente' },
];

function buildApi(overrides = {}) {
  return {
    getAdopter: vi.fn(async () => ADOPTER),
    listFollowUps: vi.fn(async () => FOLLOW_UPS),
    createFollowUp: vi.fn(async () => ({})),
    ...overrides,
  };
}

async function open(api, search, navigate = vi.fn()) {
  await initFollowUpsPage(document, { api, search, navigate });
  return navigate;
}
const stateTitle = () => document.querySelector('.state__title')?.textContent;

describe('página de seguimiento', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada sin contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initFollowUpsPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it('sin adoptante en la URL pide abrirla desde el perfil', async () => {
    const api = buildApi();
    await open(api, '');
    expect(stateTitle()).toBe('Falta el adoptante');
    expect(api.getAdopter).not.toHaveBeenCalled();
  });

  it('lista solo las adopciones que admiten seguimiento y marca la página actual', async () => {
    await open(buildApi(), '?adopter=2');
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Seguimiento');
    expect([...document.querySelectorAll('.card-title')].map((n) => n.textContent)).toEqual(['Luna']);
  });

  it('el error al cargar adopciones permite reintentar', async () => {
    const getAdopter = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Sin conexión', { status: 0 }))
      .mockResolvedValue(ADOPTER);
    await open(buildApi({ getAdopter }), '?adopter=2');
    expect(stateTitle()).toBe('No pudimos cargar tus adopciones');
    document.querySelector('.state button').click();
    await until(() => document.querySelector('.card-title'));
  });

  it('muestra el formulario y el historial más reciente primero', async () => {
    const api = buildApi();
    await open(api, '?adopter=2&adoption=7');
    expect(api.listFollowUps).toHaveBeenCalledWith('7', '2');
    expect(document.querySelector('h1').textContent).toBe('Seguimiento de Luna');
    const texts = [...document.querySelectorAll('.review-card__comment')].map((n) => n.textContent);
    expect(texts).toEqual(['Reciente', 'Antiguo']);
  });

  it('registra un seguimiento y recarga el historial', async () => {
    const api = buildApi();
    await open(api, '?adopter=2&adoption=7');
    document.querySelector('#followup-status').value = 'GOOD';
    document.querySelector('#followup-observations').value = 'Todo bien';
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await until(() => api.listFollowUps.mock.calls.length === 2);
    expect(api.createFollowUp).toHaveBeenCalledWith(
      '7',
      '2',
      expect.objectContaining({ adaptationStatus: 'GOOD', observations: 'Todo bien' }),
    );
  });

  it('una adopción ajena se deniega sin consultar el seguimiento', async () => {
    const api = buildApi();
    const navigate = await open(api, '?adopter=2&adoption=99');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
    expect(api.listFollowUps).not.toHaveBeenCalled();
    expect(document.querySelector('.review-card')).toBeNull();
    document.querySelector('.state button').click();
    expect(navigate).toHaveBeenCalledWith('follow-ups.html?adopter=2');
  });

  it('un id de adopción no numérico se deniega', async () => {
    await open(buildApi(), '?adopter=2&adoption=abc');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
  });

  it('si el back responde 403 muestra acceso denegado y no deja datos en pantalla', async () => {
    const listFollowUps = vi.fn(async () => {
      throw new ApiError('Prohibido', { status: 403 });
    });
    await open(buildApi({ listFollowUps }), '?adopter=2&adoption=7');
    expect(stateTitle()).toBe(ACCESS_DENIED_TITLE);
    expect(document.querySelector('form')).toBeNull();
    expect(document.body.textContent).not.toContain('Antiguo');
  });

  it('un error del servidor en el historial permite reintentar', async () => {
    const listFollowUps = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('x', { status: 500 }))
      .mockResolvedValue(FOLLOW_UPS);
    await open(buildApi({ listFollowUps }), '?adopter=2&adoption=7');
    expect(stateTitle()).toBe('No pudimos cargar el historial');
    document.querySelector('.state button').click();
    await until(() => document.querySelector('.review-card'));
  });

  it('un error al cargar la adopción permite reintentar', async () => {
    const getAdopter = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('x', { status: 500 }))
      .mockResolvedValue(ADOPTER);
    await open(buildApi({ getAdopter }), '?adopter=2&adoption=7');
    expect(stateTitle()).toBe('No pudimos cargar tu adopción');
    document.querySelector('.state button').click();
    await until(() => document.querySelector('form'));
  });
});
