import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { init } from '../src/js/breed.js';
import { createBreedCard } from '../src/js/components/breedCard.js';
import { renderPetBreedPage } from '../src/js/pages/petBreedPage.js';
import { until } from './helpers.js';

const BREED = { id: 1, name: 'Criollo', description: 'Mestizo robusto y sociable.' };
const notFound = (message) => new ApiError(message, { status: 404 });

async function open(deps = {}) {
  document.body.innerHTML = '<div id="app"></div>';
  await renderPetBreedPage(document.getElementById('app'), 7, {
    fetchBreed: vi.fn().mockResolvedValue(BREED),
    fetchPet: vi.fn().mockResolvedValue({ id: 7, name: 'Luna' }),
    ...deps,
  });
}

describe('renderPetBreedPage', () => {
  it('muestra el nombre de la raza, su descripción y el nombre de la mascota', async () => {
    await open();
    expect(document.querySelector('h1').textContent).toBe('Raza de Luna');
    expect(document.querySelector('.breed-card__name').textContent).toBe('Criollo');
    expect(document.querySelector('.breed-card__text').textContent).toBe(
      'Mestizo robusto y sociable.',
    );
  });

  it('muestra el loader mientras carga', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPetBreedPage(document.getElementById('app'), 7, {
      fetchBreed: () => new Promise(() => {}),
      fetchPet: () => new Promise(() => {}),
    });
    expect(document.querySelector('.state--loading')).not.toBeNull();
  });

  it('si la mascota existe pero no tiene raza, lo informa', async () => {
    await open({ fetchBreed: vi.fn().mockRejectedValue(notFound('Breed not found')) });
    expect(document.querySelector('.state__title').textContent).toBe(
      'Esta mascota aún no tiene raza registrada',
    );
    expect(document.querySelector('h1').textContent).toBe('Raza de Luna');
  });

  it('si la mascota no existe, muestra mascota no encontrada', async () => {
    await open({
      fetchPet: vi.fn().mockRejectedValue(notFound('Pet not found')),
      fetchBreed: vi.fn().mockRejectedValue(notFound('Pet not found')),
    });
    expect(document.querySelector('.state__title').textContent).toBe('Mascota no encontrada');
  });

  it('un error de la raza distinto de 404 muestra el error y reintenta', async () => {
    const fetchBreed = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Sin conexión', { status: 0 }))
      .mockResolvedValueOnce(BREED);
    await open({ fetchBreed });
    expect(document.querySelector('[role="alert"]').textContent).toContain('Sin conexión');
    document.querySelector('[role="alert"] button').click();
    await until(() => document.querySelector('.breed-card'));
  });

  it('mantiene el título genérico si la mascota no trae nombre', async () => {
    await open({ fetchPet: vi.fn().mockResolvedValue({ id: 7 }) });
    expect(document.querySelector('h1').textContent).toBe('Raza de la mascota');
  });
});

describe('createBreedCard', () => {
  it('usa textos por defecto si faltan nombre o descripción', () => {
    for (const breed of [{}, { name: ' ', description: '' }, { name: 5, description: null }]) {
      const card = createBreedCard(breed);
      expect(card.querySelector('h2').textContent).toBe('Raza sin nombre');
      expect(card.querySelector('p').textContent).toContain('aún no tiene una descripción');
    }
  });

  it('no inserta HTML venido del API', () => {
    const card = createBreedCard({ name: '<img src=x>', description: '<b>hola</b>' });
    expect(card.querySelector('img, b')).toBeNull();
  });
});

describe('init (raza.html)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
  });

  it.each(['', '?petId=x'])('sin id válido (%s) avisa que falta la mascota', async (search) => {
    await init(document, search);
    expect(document.querySelector('.state__title').textContent).toBe('Falta la mascota');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('con id válido pide la mascota y su raza', async () => {
    await init(document, '?petId=7');
    const urls = fetch.mock.calls.map((call) => call[0]);
    expect(urls).toContain('/api/pets/7/breed');
    expect(urls).toContain('/api/pets/7');
  });

  it('sin contenedor no falla', async () => {
    document.body.innerHTML = '';
    await expect(init(document, '?petId=7')).resolves.toBeUndefined();
  });
});
