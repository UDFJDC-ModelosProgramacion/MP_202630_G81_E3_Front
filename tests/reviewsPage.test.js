import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/reviews.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';

/** Back falso: GET devuelve las reseñas guardadas y POST agrega una nueva. */
function fakeBackend(initial = []) {
  const store = [...initial];
  fetch.mockImplementation(async (_url, init) => {
    if (init.method === 'POST') {
      const created = { id: store.length + 1, ...JSON.parse(init.body) };
      store.push(created);
      return jsonResponse(created, 201);
    }
    return jsonResponse(store);
  });
  return store;
}

function fillAndSubmit(comments, score) {
  document.querySelector('#review-comments').value = comments;
  document.querySelector(`#review-score-${score}`).checked = true;
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('init (página de reseñas)', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta el encabezado y consulta las reseñas de la adopción de la URL', async () => {
    fakeBackend();

    await init(document, '?adoption=3');

    expect(document.querySelector('.brand__name')).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoptions/3/reviews',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(document.querySelector('h1').textContent).toBe('Reseñas de la adopción');
    expect(document.querySelector('form')).not.toBeNull();
  });

  it('muestra el estado vacío cuando la adopción no tiene reseñas', async () => {
    fakeBackend();

    await init(document, '?adoption=3');

    expect(document.querySelector('.review-card')).toBeNull();
    expect(document.querySelector('.state__title').textContent).toBe('Aún no hay reseñas');
  });

  it('lista las reseñas existentes', async () => {
    fakeBackend([{ id: 1, comments: 'Muy linda experiencia', score: '5' }]);

    await init(document, '?adoption=3');

    const cards = document.querySelectorAll('.review-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Muy linda experiencia');
  });

  it('publica una reseña y actualiza la lista sin recargar la página', async () => {
    fakeBackend();
    await init(document, '?adoption=3');

    fillAndSubmit('Excelente proceso', 4);

    await until(() => document.querySelectorAll('.review-card').length === 1);
    const post = fetch.mock.calls.find(([, init]) => init.method === 'POST');
    expect(post[0]).toBe('/api/adoptions/3/reviews');
    expect(JSON.parse(post[1].body)).toEqual({ comments: 'Excelente proceso', score: '4' });
    expect(document.querySelector('.form-feedback--success').textContent).toBe(
      'Gracias, tu reseña fue publicada.',
    );
  });

  it('muestra el error del back si no se puede publicar', async () => {
    fakeBackend();
    await init(document, '?adoption=3');
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Adoption not found' } }, 404));

    fillAndSubmit('Bien', 3);

    await until(() => document.querySelector('.form-feedback--error').textContent !== '');
    expect(document.querySelector('.form-feedback--error').textContent).toBe('Adoption not found');
  });

  it.each(['', '?adoption=abc', '?adoption=', '?otro=1'])(
    'sin una adopción válida en la URL (%s) no consulta al back',
    async (search) => {
      await init(document, search);

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Falta la adopción');
      expect(document.querySelector('form')).toBeNull();
    },
  );

  it('muestra el error de carga y permite reintentar', async () => {
    fakeBackend([{ id: 1, comments: 'Bien', score: '5' }]);
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await init(document, '?adoption=3');

    const alert = document.querySelector('.state--error');
    expect(alert.textContent).toContain('No pudimos cargar las reseñas');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

    alert.querySelector('button').click();

    await until(() => document.querySelectorAll('.review-card').length === 1);
    expect(document.querySelector('.state--error')).toBeNull();
  });

  it('muestra el mensaje del back cuando la adopción no existe', async () => {
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Adoption not found' } }, 404));

    await init(document, '?adoption=99');

    expect(document.querySelector('.state--error').textContent).toContain('Adoption not found');
  });

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document, '?adoption=3')).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
