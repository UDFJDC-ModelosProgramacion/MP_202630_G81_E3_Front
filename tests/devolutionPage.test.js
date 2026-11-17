import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { NOT_FOUND_TITLE, initDevolutionPage } from '../src/js/pages/devolutionPage.js';

const ADOPTION = { id: 7, adoptionDate: '2026-09-01', status: 'COMPLETED' };
const DEVOLUTION = { id: 1, date: '2026-09-15', reason: 'El adoptante cambió de ciudad.' };
const NO_DEVOLUTION = new ApiError('Devolución no encontrada para esta adopción', { status: 404 });

function buildApi(overrides = {}) {
  return {
    getAdoption: vi.fn().mockResolvedValue(ADOPTION),
    getDevolution: vi.fn().mockRejectedValue(NO_DEVOLUTION),
    createDevolution: vi.fn().mockResolvedValue(DEVOLUTION),
    ...overrides,
  };
}

async function openPage(api, search = '?adoption=7') {
  await initDevolutionPage(document, { api, search });
}

function fillForm({ date = '', reason = '' }) {
  document.querySelector('#devolution-date').value = date;
  document.querySelector('#devolution-reason').value = reason;
}

const submit = () =>
  document
    .querySelector('#devolution-form')
    .dispatchEvent(new Event('submit', { cancelable: true }));
const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';
const stateTitle = () => document.querySelector('.state__title')?.textContent;

describe('página de devolución', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initDevolutionPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it.each(['', '?adoption=abc', '?adoption='])(
    'sin una adopción válida en la URL (%s) no consulta al back',
    async (search) => {
      const api = buildApi();

      await openPage(api, search);

      expect(api.getAdoption).not.toHaveBeenCalled();
      expect(stateTitle()).toBe('Falta la adopción');
    },
  );

  it('sin devolución muestra los datos de la adopción y el formulario', async () => {
    const api = buildApi();

    await openPage(api);

    expect(api.getAdoption).toHaveBeenCalledWith('7');
    expect(api.getDevolution).toHaveBeenCalledWith('7');
    expect(document.querySelector('.brand__name')).not.toBeNull();
    expect(document.querySelector('#adoption-summary-title')).not.toBeNull();
    expect(document.querySelector('#devolution-form')).not.toBeNull();
  });

  describe('registro', () => {
    it('registra la devolución, confirma y muestra la fecha y el motivo', async () => {
      const api = buildApi();
      await openPage(api);
      fillForm({ date: '2026-09-15', reason: '  El adoptante cambió de ciudad.  ' });

      submit();

      await vi.waitFor(() => expect(document.querySelector('#devolution-title')).not.toBeNull());
      expect(api.createDevolution).toHaveBeenCalledWith('7', {
        date: '2026-09-15',
        reason: 'El adoptante cambió de ciudad.',
      });
      expect(feedbackText()).toContain('Devolución registrada correctamente.');
      expect(document.querySelector('#devolution-form')).toBeNull();
      expect(document.querySelector('time[datetime="2026-09-15"]')).not.toBeNull();
    });

    it('rechaza datos vacíos e indica cada campo inválido', async () => {
      const api = buildApi();
      await openPage(api);

      submit();

      expect(api.createDevolution).not.toHaveBeenCalled();
      expect(document.querySelector('#devolution-date-error').textContent).toBe(
        'La fecha de la devolución es obligatoria.',
      );
      expect(document.querySelector('#devolution-reason-error').textContent).toBe(
        'El motivo de la devolución es obligatorio.',
      );
    });

    it('rechaza una fecha anterior a la de la adopción sin llamar al back', async () => {
      const api = buildApi();
      await openPage(api);
      fillForm({ date: '2026-08-31', reason: 'Motivo' });

      submit();

      expect(api.createDevolution).not.toHaveBeenCalled();
      expect(document.querySelector('#devolution-date-error').textContent).toBe(
        'La fecha de la devolución no puede ser anterior a la fecha de la adopción',
      );
    });

    it('muestra el mensaje del back cuando la adopción ya tiene devolución', async () => {
      const message = 'La adopción ya tiene una devolución registrada';
      const api = buildApi({
        createDevolution: vi.fn().mockRejectedValue(new ApiError(message, { status: 412 })),
      });
      await openPage(api);
      fillForm({ date: '2026-09-15', reason: 'Motivo' });

      submit();

      await vi.waitFor(() => expect(feedbackText()).toContain(message));
      expect(document.querySelector('.alert-danger')).not.toBeNull();
      expect(document.querySelector('#devolution-form')).not.toBeNull();
      expect(document.querySelector('button[type="submit"]').disabled).toBe(false);
    });
  });

  describe('consulta', () => {
    it('si la adopción ya tiene devolución muestra su fecha y motivo, sin formulario', async () => {
      const api = buildApi({ getDevolution: vi.fn().mockResolvedValue(DEVOLUTION) });

      await openPage(api);

      expect(document.querySelector('#devolution-form')).toBeNull();
      expect(document.querySelector('#devolution-title').textContent).toBe('Devolución registrada');
      expect(document.querySelector('time[datetime="2026-09-15"]').textContent).toBe(
        '15 de septiembre de 2026',
      );
      expect(document.body.textContent).toContain('El adoptante cambió de ciudad.');
    });
  });

  describe('errores de carga', () => {
    it('si la adopción no existe (404) lo informa', async () => {
      const notFound = new ApiError('Adopción no encontrada', { status: 404 });
      const api = buildApi({
        getAdoption: vi.fn().mockRejectedValue(notFound),
        getDevolution: vi.fn().mockRejectedValue(notFound),
      });

      await openPage(api);

      expect(stateTitle()).toBe(NOT_FOUND_TITLE);
      expect(NOT_FOUND_TITLE).toBe('Adopción no encontrada');
      expect(document.querySelector('#devolution-form')).toBeNull();
    });

    it('ante un error del servidor muestra el error y permite reintentar', async () => {
      const api = buildApi({
        getAdoption: vi
          .fn()
          .mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
          .mockResolvedValue(ADOPTION),
      });
      await openPage(api);

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar la adopción');

      alert.querySelector('button').click();

      await vi.waitFor(() => expect(document.querySelector('#devolution-form')).not.toBeNull());
    });
  });
});
