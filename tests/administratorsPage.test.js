import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initAdministratorsPage } from '../src/js/pages/administratorsPage.js';

const SHELTERS = [
  { id: 1, name: 'Huellitas', city: 'Bogotá' },
  { id: 2, name: 'Patitas', city: 'Medellín' },
];
const MARTA = {
  id: 7,
  name: 'Marta Gómez',
  email: 'marta@huellitas.org',
  role: 'DIRECTOR',
  shelters: [],
};

function buildApi(overrides = {}) {
  return {
    listAdministrators: vi.fn().mockResolvedValue([]),
    createAdministrator: vi.fn().mockResolvedValue(MARTA),
    deleteAdministrator: vi.fn().mockResolvedValue(null),
    associateShelter: vi.fn().mockResolvedValue({}),
    listShelters: vi.fn().mockResolvedValue(SHELTERS),
    ...overrides,
  };
}

async function openPage(api, confirmAction = () => true) {
  await initAdministratorsPage(document, { api, confirmAction });
}

function fillForm({ name = '', email = '', role = '' }) {
  document.querySelector('#administrator-name').value = name;
  document.querySelector('#administrator-email').value = email;
  document.querySelector('#administrator-role').value = role;
}

function submit(form) {
  form.dispatchEvent(new Event('submit', { cancelable: true }));
}

const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';

describe('página de administradores', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initAdministratorsPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it('marca la página actual en el encabezado y muestra el estado vacío', async () => {
    await openPage(buildApi());

    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Administradores');
    expect(document.querySelector('.state--empty')).not.toBeNull();
  });

  it('muestra los administradores existentes con sus refugios', async () => {
    const api = buildApi({
      listAdministrators: vi.fn().mockResolvedValue([{ ...MARTA, shelters: [SHELTERS[0]] }]),
    });

    await openPage(api);

    const card = document.querySelector('article.card');
    expect(card.textContent).toContain('Marta Gómez');
    expect(card.textContent).toContain('Huellitas · Bogotá');
  });

  describe('registro', () => {
    it('registra al administrador, limpia el formulario y refresca el listado', async () => {
      const api = buildApi();
      await openPage(api);
      fillForm({ name: ' Marta Gómez ', email: 'marta@huellitas.org ', role: 'DIRECTOR' });

      submit(document.querySelector('#administrator-form'));

      await vi.waitFor(() => expect(api.listAdministrators).toHaveBeenCalledTimes(2));
      expect(api.createAdministrator).toHaveBeenCalledWith({
        name: 'Marta Gómez',
        email: 'marta@huellitas.org',
        role: 'DIRECTOR',
      });
      expect(feedbackText()).toContain('Administrador Marta Gómez registrado.');
      expect(document.querySelector('#administrator-name').value).toBe('');
    });

    it('rechaza datos vacíos e indica cada campo inválido', async () => {
      const api = buildApi();
      await openPage(api);

      submit(document.querySelector('#administrator-form'));

      expect(api.createAdministrator).not.toHaveBeenCalled();
      expect(document.querySelector('#administrator-name-error').textContent).toBe(
        'El nombre es obligatorio.',
      );
      expect(document.querySelector('#administrator-email-error').textContent).toBe(
        'El correo es obligatorio.',
      );
      expect(document.querySelector('#administrator-role-error').textContent).toBe(
        'El rol es obligatorio.',
      );
    });

    it('muestra el mensaje del back cuando el correo ya está registrado', async () => {
      const message = 'El email ya está registrado para otro administrador';
      const api = buildApi({
        createAdministrator: vi.fn().mockRejectedValue(new ApiError(message, { status: 412 })),
      });
      await openPage(api);
      fillForm({ name: 'Marta', email: 'marta@huellitas.org', role: 'DIRECTOR' });

      submit(document.querySelector('#administrator-form'));

      await vi.waitFor(() => expect(feedbackText()).toContain(message));
      expect(document.querySelector('.alert-danger')).not.toBeNull();
      expect(document.querySelector('button[type="submit"]').disabled).toBe(false);
    });
  });

  describe('asociación de refugios', () => {
    async function openWithMarta(api) {
      const withMarta = {
        ...api,
        listAdministrators: vi.fn().mockResolvedValue([MARTA]),
      };
      await openPage(withMarta);
      return withMarta;
    }

    it('asocia los refugios seleccionados y refresca el listado', async () => {
      const api = await openWithMarta(buildApi());
      document.querySelector('#administrator-7-shelter-1').checked = true;
      document.querySelector('#administrator-7-shelter-2').checked = true;

      submit(document.querySelector('details form'));

      await vi.waitFor(() => expect(api.listAdministrators).toHaveBeenCalledTimes(2));
      expect(api.associateShelter.mock.calls).toEqual([
        [7, 1],
        [7, 2],
      ]);
      expect(feedbackText()).toContain('Refugios asociados a Marta Gómez: 2.');
    });

    it('informa que el administrador ya está asociado con el refugio', async () => {
      const message = 'El administrador ya está asociado con este refugio';
      const api = await openWithMarta(
        buildApi({
          associateShelter: vi.fn().mockRejectedValue(new ApiError(message, { status: 412 })),
        }),
      );
      document.querySelector('#administrator-7-shelter-1').checked = true;

      submit(document.querySelector('details form'));

      await vi.waitFor(() => expect(feedbackText()).toContain(message));
      expect(feedbackText()).toContain('Huellitas');
      expect(api.listAdministrators).toHaveBeenCalledTimes(1);
    });

    it('pide seleccionar al menos un refugio', async () => {
      const api = await openWithMarta(buildApi());

      submit(document.querySelector('details form'));

      await vi.waitFor(() => expect(feedbackText()).toContain('Selecciona al menos un refugio.'));
      expect(api.associateShelter).not.toHaveBeenCalled();
    });

    it('advierte si no pudo cargar los refugios pero muestra el listado', async () => {
      const api = buildApi({
        listShelters: vi.fn().mockRejectedValue(new ApiError('sin red', { status: 0 })),
        listAdministrators: vi.fn().mockResolvedValue([MARTA]),
      });

      await openPage(api);

      expect(feedbackText()).toContain('No pudimos cargar los refugios.');
      expect(document.querySelector('article.card')).not.toBeNull();
    });
  });

  describe('eliminación', () => {
    function buildApiWithMarta(overrides) {
      return buildApi({ listAdministrators: vi.fn().mockResolvedValue([MARTA]), ...overrides });
    }

    it('elimina al administrador tras confirmar y refresca el listado', async () => {
      const api = buildApiWithMarta();
      await openPage(api);

      document.querySelector('.btn-outline-danger').click();

      await vi.waitFor(() => expect(api.listAdministrators).toHaveBeenCalledTimes(2));
      expect(api.deleteAdministrator).toHaveBeenCalledWith(7);
      expect(feedbackText()).toContain('Administrador Marta Gómez eliminado.');
    });

    it('no elimina si el usuario cancela', async () => {
      const api = buildApiWithMarta();
      await openPage(api, () => false);

      document.querySelector('.btn-outline-danger').click();

      expect(api.deleteAdministrator).not.toHaveBeenCalled();
    });

    it('informa el motivo cuando el administrador tiene refugios asociados', async () => {
      const message = 'No se puede eliminar un administrador asociado con refugios';
      const api = buildApiWithMarta({
        deleteAdministrator: vi.fn().mockRejectedValue(new ApiError(message, { status: 412 })),
      });
      await openPage(api);

      document.querySelector('.btn-outline-danger').click();

      await vi.waitFor(() => expect(feedbackText()).toContain(message));
      expect(api.listAdministrators).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const api = buildApi({
      listAdministrators: vi
        .fn()
        .mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', { status: 0 }))
        .mockResolvedValue([MARTA]),
    });
    await openPage(api);
    expect(document.querySelector('[role="alert"].state--error')).not.toBeNull();

    document.querySelector('.state--error button').click();

    await vi.waitFor(() => expect(document.querySelector('article.card')).not.toBeNull());
  });
});
