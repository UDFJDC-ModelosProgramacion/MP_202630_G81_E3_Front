import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initVeterinariansPage } from '../src/js/pages/veterinariansPage.js';

const SHELTERS = [
  {
    id: 1,
    name: 'Huellas Felices',
    city: 'Bogotá',
    veterinarians: [
      {
        id: 5,
        name: 'Laura Ruiz',
        speciality: 'Medicina general',
        age: 35,
        gender: 'FEMALE',
        available: true,
      },
      {
        id: 6,
        name: 'Andrés Mora',
        speciality: 'Cirugía',
        age: 42,
        gender: 'MALE',
        available: false,
      },
    ],
  },
  { id: 2, name: 'Patitas', city: 'Medellín', veterinarians: [] },
];

function buildApi(overrides = {}) {
  return {
    listShelters: vi.fn().mockResolvedValue(SHELTERS),
    createVeterinarian: vi.fn().mockResolvedValue({ id: 9 }),
    ...overrides,
  };
}

const openPage = (api) => initVeterinariansPage(document, { api });

function fillForm({ name = '', speciality = '', age = '', gender = '', shelterId = '' }) {
  document.querySelector('#veterinarian-name').value = name;
  document.querySelector('#veterinarian-speciality').value = speciality;
  document.querySelector('#veterinarian-age').value = age;
  document.querySelector('#veterinarian-gender').value = gender;
  document.querySelector('#veterinarian-shelterId').value = shelterId;
}

function submit() {
  const form = document.querySelector('#veterinarian-form');
  form.dispatchEvent(new Event('submit', { cancelable: true }));
}

const feedbackText = () => document.querySelector('#feedback .alert')?.textContent ?? '';

describe('página de veterinarios', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(initVeterinariansPage(document, { api: buildApi() })).resolves.toBeUndefined();
  });

  it('marca la página actual y agrupa los veterinarios por refugio', async () => {
    await openPage(buildApi());

    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Veterinarios');
    const cards = document.querySelectorAll('article.card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Huellas Felices · Bogotá');
    expect(cards[0].textContent).toContain('Laura Ruiz');
    expect(cards[0].textContent).toContain('35 años · Femenino');
    expect(cards[1].textContent).toContain('Este refugio aún no tiene veterinarios.');
  });

  it('enlaza cada veterinario con su historial médico', async () => {
    await openPage(buildApi());

    const link = document.querySelector('article.card a');
    expect(link.getAttribute('href')).toBe('medical-history.html?veterinarian=5');
  });

  it('llena el selector con los refugios', async () => {
    await openPage(buildApi());

    const options = [...document.querySelectorAll('#veterinarian-shelterId option')];
    expect(options.map((option) => option.textContent)).toEqual([
      'Selecciona un refugio',
      'Huellas Felices · Bogotá',
      'Patitas · Medellín',
    ]);
  });

  it('muestra el estado vacío si no hay refugios', async () => {
    await openPage(buildApi({ listShelters: vi.fn().mockResolvedValue([]) }));

    expect(document.querySelector('.state--empty')).not.toBeNull();
  });

  it('muestra el error del servidor y reintenta la carga', async () => {
    const listShelters = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('No encontrado', { status: 404 }))
      .mockResolvedValue(SHELTERS);
    await openPage(buildApi({ listShelters }));

    expect(document.querySelector('.state--error')).not.toBeNull();
    document.querySelector('.state--error button').click();
    await vi.waitFor(() => expect(document.querySelectorAll('article.card')).toHaveLength(2));
  });

  it('valida los campos y no llama al back si hay errores', async () => {
    const api = buildApi();
    await openPage(api);

    fillForm({});
    submit();

    expect(api.createVeterinarian).not.toHaveBeenCalled();
    expect(document.querySelector('#veterinarian-name-error').textContent).toBe(
      'El nombre es obligatorio.',
    );
    expect(document.querySelector('#veterinarian-shelterId-error').textContent).toBe(
      'Selecciona el refugio donde trabaja.',
    );
  });

  it('registra el veterinario en el refugio elegido y recarga la lista', async () => {
    const api = buildApi();
    await openPage(api);

    fillForm({
      name: '  Andrés Mora ',
      speciality: ' Cirugía ',
      age: '42',
      gender: 'MALE',
      shelterId: '2',
    });
    submit();

    await vi.waitFor(() => expect(feedbackText()).toContain('Veterinario Andrés Mora registrado.'));
    expect(api.createVeterinarian).toHaveBeenCalledWith(2, {
      name: 'Andrés Mora',
      speciality: 'Cirugía',
      age: 42,
      gender: 'MALE',
    });
    expect(api.listShelters).toHaveBeenCalledTimes(2);
    expect(document.querySelector('#veterinarian-name').value).toBe('');
  });

  it('muestra el mensaje del back si el registro falla', async () => {
    const api = buildApi({
      createVeterinarian: vi
        .fn()
        .mockRejectedValue(new ApiError('Refugio no válido', { status: 412 })),
    });
    await openPage(api);

    fillForm({ name: 'Andrés', speciality: 'Cirugía', age: '42', gender: 'MALE', shelterId: '1' });
    submit();

    await vi.waitFor(() => expect(feedbackText()).toContain('Refugio no válido'));
    expect(document.querySelector('#veterinarian-form button').disabled).toBe(false);
  });

  it('muestra la disponibilidad de cada veterinario', async () => {
    await openPage(buildApi());

    const badges = [
      ...document.querySelectorAll(
        'article.card .badge.text-bg-success, article.card .badge.text-bg-warning',
      ),
    ];
    expect(badges.map((badge) => badge.textContent)).toEqual([
      'Disponible',
      'En proceso de adopción',
    ]);
  });

  it('valida edad y género', async () => {
    const api = buildApi();
    await openPage(api);

    fillForm({ name: 'Ana', speciality: 'Cirugía', age: '12', gender: '', shelterId: '1' });
    submit();

    expect(api.createVeterinarian).not.toHaveBeenCalled();
    expect(document.querySelector('#veterinarian-age-error').textContent).toBe(
      'La edad debe ser un número entero entre 18 y 100.',
    );
    expect(document.querySelector('#veterinarian-gender-error').textContent).toBe(
      'Selecciona el género.',
    );
  });

  it('omite edad y género en veterinarios registrados antes de esos campos', async () => {
    const legacy = [
      {
        id: 1,
        name: 'Huellas',
        city: 'Bogotá',
        veterinarians: [{ id: 3, name: 'Carlos', speciality: 'General' }],
      },
    ];
    await openPage(buildApi({ listShelters: vi.fn().mockResolvedValue(legacy) }));

    const card = document.querySelector('article.card');
    expect(card.textContent).toContain('Carlos');
    expect(card.textContent).not.toContain('años');
    expect(card.textContent).toContain('Disponible');
  });
});
