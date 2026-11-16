import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/requirements.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';
const REQUIREMENTS = [
  { id: 1, description: 'Tener casa propia con patio cerrado.', isMandatory: true },
  { id: 2, description: 'Ser mayor de edad.', isMandatory: true },
];

describe('init (página de requisitos)', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta el encabezado con el enlace de requisitos como página actual', async () => {
    fetch.mockResolvedValue(jsonResponse(REQUIREMENTS));

    await init(document);

    const current = document.querySelector('[aria-current="page"]');
    expect(current.textContent).toBe('Requisitos');
    expect(current.getAttribute('href')).toBe('requirements.html');
  });

  it('consulta y lista los requisitos de adopción', async () => {
    fetch.mockResolvedValue(jsonResponse(REQUIREMENTS));

    await init(document);

    expect(fetch).toHaveBeenCalledWith(
      '/api/adoption-requirements',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(document.querySelector('h1').textContent).toBe('Requisitos para adoptar');
    expect(document.querySelectorAll('.requirement')).toHaveLength(2);
  });

  it('muestra el estado vacío cuando no hay requisitos', async () => {
    fetch.mockResolvedValue(jsonResponse([]));

    await init(document);

    expect(document.querySelector('.state__title').textContent).toBe(
      'Aún no hay requisitos registrados',
    );
  });

  it('trata una respuesta que no es una lista como sin requisitos', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await init(document);

    expect(document.querySelector('.requirement')).toBeNull();
    expect(document.querySelector('.state--empty')).not.toBeNull();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetch.mockResolvedValue(jsonResponse(REQUIREMENTS));

    await init(document);

    const alert = document.querySelector('.state--error');
    expect(alert.textContent).toContain('No pudimos cargar los requisitos');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

    alert.querySelector('button').click();

    await until(() => document.querySelectorAll('.requirement').length === 2);
    expect(document.querySelector('.state--error')).toBeNull();
  });

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document)).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
