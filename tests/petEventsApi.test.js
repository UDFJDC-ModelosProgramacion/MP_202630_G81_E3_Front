import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPetEvents } from '../src/js/api/petEventsApi.js';
import { jsonResponse } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

describe('getPetEvents', () => {
  it('consulta GET /api/pets/{id}/events', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }]));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getPetEvents(7)).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets/7/events');
  });
});
