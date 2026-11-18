import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { initDevolutionHistoryPage } from '../src/js/pages/devolutionHistoryPage.js';

const DEVOLUTIONS = [
  {
    id: 1,
    date: '2026-09-15',
    reason: 'Cambio de ciudad',
    adoption: { id: 7, pet: { name: 'Luna' }, adopter: { name: 'Ana' } },
  },
];

const rowNames = () => [...document.querySelectorAll('tbody th')].map((n) => n.textContent);

describe('página de historial de devoluciones', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
  });

  it('no hace nada si la página no tiene contenedor', async () => {
    document.body.innerHTML = '';
    await expect(
      initDevolutionHistoryPage(document, { api: { listDevolutions: vi.fn() } }),
    ).resolves.toBeUndefined();
  });

  it('marca la página actual y lista las devoluciones', async () => {
    const api = { listDevolutions: vi.fn().mockResolvedValue(DEVOLUTIONS) };

    await initDevolutionHistoryPage(document, { api });

    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Devoluciones');
    expect(document.querySelector('h1').textContent).toBe('Historial de devoluciones');
    expect(rowNames()).toEqual(['Luna']);
  });

  it.each([[[]], [null], [{}]])('sin devoluciones (%j) muestra el estado vacío', async (data) => {
    const api = { listDevolutions: vi.fn().mockResolvedValue(data) };

    await initDevolutionHistoryPage(document, { api });

    expect(document.querySelector('.state__title').textContent).toBe(
      'Aún no hay devoluciones registradas',
    );
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const api = {
      listDevolutions: vi
        .fn()
        .mockRejectedValueOnce(new ApiError('No se pudo conectar con el servidor.', { status: 0 }))
        .mockResolvedValue(DEVOLUTIONS),
    };
    await initDevolutionHistoryPage(document, { api });

    const alert = document.querySelector('.state--error');
    expect(alert.textContent).toContain('No pudimos cargar las devoluciones');
    expect(alert.textContent).toContain('No se pudo conectar con el servidor.');

    alert.querySelector('button').click();

    await vi.waitFor(() => expect(rowNames()).toEqual(['Luna']));
  });
});