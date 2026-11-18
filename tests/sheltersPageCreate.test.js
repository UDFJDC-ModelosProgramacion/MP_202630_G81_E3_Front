import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initSheltersPage } from '../src/js/pages/sheltersPage.js';

const SHELTERS = [{ id: 1, name: 'Huellitas', city: 'Bogotá', pets: [] }];

function buildApi(overrides = {}) {
  return {
    listShelters: vi.fn().mockResolvedValue(SHELTERS),
    getShelter: vi.fn(),
    createShelter: vi.fn().mockResolvedValue({ id: 2, name: 'Colitas', city: 'Cali' }),
    ...overrides,
  };
}

async function openPage(api) {
  await initSheltersPage(document, { api, search: '' });
}

function fillForm({ name = '', city = '' }) {
  document.querySelector('#shelter-form-name').value = name;
  document.querySelector('#shelter-form-city').value = city;
}

const submit = () =>
  document
    .querySelector('#shelter-create-form')
    .dispatchEvent(new Event('submit', { cancelable: true }));
const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';

describe('registro de refugios en la página', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('registra el refugio, limpia el formulario y refresca el listado', async () => {
    const api = buildApi();
    await openPage(api);
    fillForm({ name: '  Colitas ', city: ' Cali ' });

    submit();

    await vi.waitFor(() => expect(api.listShelters).toHaveBeenCalledTimes(2));
    expect(api.createShelter).toHaveBeenCalledWith({ name: 'Colitas', city: 'Cali' });
    expect(feedbackText()).toContain('Refugio Colitas registrado.');
    expect(document.querySelector('#shelter-form-name').value).toBe('');
  });

  it('rechaza datos vacíos e indica cada campo sin llamar al back', async () => {
    const api = buildApi();
    await openPage(api);

    submit();

    expect(api.createShelter).not.toHaveBeenCalled();
    expect(document.querySelector('#shelter-form-name-error').textContent).toBe(
      'El nombre es obligatorio.',
    );
    expect(document.querySelector('#shelter-form-city-error').textContent).toBe(
      'La ciudad es obligatoria.',
    );
  });

  it('muestra el mensaje del back cuando el refugio ya existe', async () => {
    const message = 'Un refugio con este nombre ya existe en esta ciudad';
    const api = buildApi({
      createShelter: vi.fn().mockRejectedValue(new ApiError(message, { status: 412 })),
    });
    await openPage(api);
    fillForm({ name: 'Huellitas', city: 'Bogotá' });

    submit();

    await vi.waitFor(() => expect(feedbackText()).toContain(message));
    expect(document.querySelector('.alert-danger')).not.toBeNull();
    expect(document.querySelector('#shelter-create-form button').disabled).toBe(false);
    expect(api.listShelters).toHaveBeenCalledTimes(1);
  });
});