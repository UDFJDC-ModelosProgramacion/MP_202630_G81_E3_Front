import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { getNotification, listNotifications } from '../src/js/api/notificationsApi.js';
import { jsonResponse } from './helpers.js';

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listNotifications consulta las notificaciones del refugio', async () => {
    const data = [{ id: 1, content: 'Aprobada', date: '2026-11-01' }];
    fetch.mockResolvedValue(jsonResponse(data));

    await expect(listNotifications(3)).resolves.toEqual(data);
    expect(fetch).toHaveBeenCalledWith(
      '/api/shelters/3/notifications',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getNotification consulta una notificación puntual', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 7, content: 'Seguimiento' }));

    await expect(getNotification(3, 7)).resolves.toEqual({ id: 7, content: 'Seguimiento' });
    expect(fetch.mock.calls[0][0]).toBe('/api/shelters/3/notifications/7');
  });

  it('codifica los ids en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    await getNotification('a/b', 'c/d');
    expect(fetch.mock.calls[0][0]).toBe('/api/shelters/a%2Fb/notifications/c%2Fd');
  });

  it('propaga el ApiError 404 con el mensaje del back', async () => {
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Notification not found' } }, 404));

    const error = await getNotification(3, 99).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
  });
});
