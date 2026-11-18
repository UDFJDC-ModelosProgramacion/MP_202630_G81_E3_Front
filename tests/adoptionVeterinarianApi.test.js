import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assignVeterinarian, removeVeterinarian } from '../src/js/api/adoptionVeterinarianApi.js';

function lastRequest() {
  const [url, init] = fetch.mock.calls.at(-1);
  return { url, init };
}

describe('adoptionVeterinarianApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asigna el veterinario con POST /adoptions/{id}/veterinarian/{vetId}', async () => {
    await assignVeterinarian(7, 5);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/adoptions/7/veterinarian/5');
    expect(init.method).toBe('POST');
  });

  it('quita el veterinario con DELETE /adoptions/{id}/veterinarian', async () => {
    await removeVeterinarian(7);
    const { url, init } = lastRequest();
    expect(url).toBe('/api/adoptions/7/veterinarian');
    expect(init.method).toBe('DELETE');
  });
});
