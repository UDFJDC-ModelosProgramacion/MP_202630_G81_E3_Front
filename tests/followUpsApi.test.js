import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFollowUp, listFollowUps } from '../src/js/api/followUpsApi.js';
import { jsonResponse } from './helpers.js';

describe('followUpsApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([])),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('listFollowUps consulta los seguimientos de la adopción indicando el adoptante', async () => {
    await listFollowUps(5, 2);
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/5/follow-ups?adopterId=2');
  });

  it('createFollowUp envía solo fecha, estado y observaciones por POST', async () => {
    const data = { date: '2026-11-01', adaptationStatus: 'GOOD', observations: 'Bien', extra: 1 };
    await createFollowUp(5, 2, data);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/adoptions/5/follow-ups?adopterId=2');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      date: '2026-11-01',
      adaptationStatus: 'GOOD',
      observations: 'Bien',
    });
  });

  it('propaga el ApiError 403', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Prohibido' }, 403));
    await expect(listFollowUps(5, 9)).rejects.toMatchObject({ status: 403, message: 'Prohibido' });
  });
});
