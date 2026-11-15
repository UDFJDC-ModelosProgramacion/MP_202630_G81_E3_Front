import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../src/js/notifications.js';
import { jsonResponse, until } from './helpers.js';

const PAGE = '<header id="site-header"></header><main><div id="app"></div></main>';

describe('init (página de notificaciones)', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('listado', () => {
    it('muestra las notificaciones de la más reciente a la más antigua', async () => {
      fetch.mockResolvedValue(
        jsonResponse([
          { id: 1, content: 'Primera', date: '2026-01-01' },
          { id: 2, content: 'Última', date: '2026-06-01' },
        ]),
      );

      await init(document, '?shelter=3');

      expect(fetch).toHaveBeenCalledWith(
        '/api/shelters/3/notifications',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(document.querySelector('.brand__name')).not.toBeNull();
      const contents = [...document.querySelectorAll('.notification-card__content')].map(
        (node) => node.textContent,
      );
      expect(contents).toEqual(['Última', 'Primera']);
    });

    it('sin notificaciones muestra “No tienes notificaciones”', async () => {
      fetch.mockResolvedValue(jsonResponse([]));

      await init(document, '?shelter=3');

      expect(document.querySelector('.state__title').textContent).toBe('No tienes notificaciones');
    });

    it('muestra el error de carga y permite reintentar', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      fetch.mockResolvedValue(jsonResponse([{ id: 1, content: 'x', date: '2026-01-01' }]));

      await init(document, '?shelter=3');

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar las notificaciones');
      alert.querySelector('button').click();

      await until(() => document.querySelectorAll('.notification-card').length === 1);
    });
  });

  describe('detalle', () => {
    it('abre una notificación y muestra su detalle', async () => {
      fetch.mockResolvedValue(
        jsonResponse({ id: 7, content: 'Tu solicitud fue aprobada', date: '2026-11-08' }),
      );

      await init(document, '?shelter=3&notification=7');

      expect(fetch.mock.calls[0][0]).toBe('/api/shelters/3/notifications/7');
      expect(document.querySelector('.notification-detail__content').textContent).toBe(
        'Tu solicitud fue aprobada',
      );
      expect(document.querySelector('.notification-detail__date').textContent).toBe('08/11/2026');
    });

    it('si la notificación no existe (404) lo informa', async () => {
      fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Notification not found' } }, 404));

      await init(document, '?shelter=3&notification=99');

      expect(document.querySelector('.state__title').textContent).toBe('Notificación no encontrada');
    });

    it('ante un error del servidor muestra el error y permite reintentar', async () => {
      fetch.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500));
      fetch.mockResolvedValue(jsonResponse({ id: 7, content: 'Hola', date: '2026-11-08' }));

      await init(document, '?shelter=3&notification=7');

      const alert = document.querySelector('.state--error');
      expect(alert.textContent).toContain('No pudimos cargar la notificación');
      alert.querySelector('button').click();

      await until(() => document.querySelector('.notification-detail') !== null);
    });

    it('con un id de notificación inválido no consulta al back', async () => {
      await init(document, '?shelter=3&notification=abc');

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Notificación no encontrada');
    });
  });

  it.each(['', '?shelter=abc', '?shelter=', '?notification=7'])(
    'sin un refugio válido en la URL (%s) no consulta al back',
    async (search) => {
      await init(document, search);

      expect(fetch).not.toHaveBeenCalled();
      expect(document.querySelector('.state__title').textContent).toBe('Falta el refugio');
    },
  );

  it('no falla si la página no tiene encabezado ni contenedor', async () => {
    document.body.innerHTML = '';

    await expect(init(document, '?shelter=3')).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
