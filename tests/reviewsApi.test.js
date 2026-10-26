import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { createReview, listReviews } from '../src/js/api/reviewsApi.js';
import { jsonResponse } from './helpers.js';

describe('reviewsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listReviews consulta las reseñas de la adopción', async () => {
    const reviews = [{ id: 1, comments: 'Genial', score: '5' }];
    fetch.mockResolvedValue(jsonResponse(reviews));

    await expect(listReviews(7)).resolves.toEqual(reviews);
    expect(fetch).toHaveBeenCalledWith(
      '/api/adoptions/7/reviews',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createReview envía solo comentario y calificación, esta última como texto', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 2, comments: 'Excelente', score: '4' }, 201));

    const created = await createReview(7, { comments: 'Excelente', score: 4, id: 99 });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/adoptions/7/reviews');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ comments: 'Excelente', score: '4' });
    expect(created.id).toBe(2);
  });

  it('codifica el id de la adopción en la ruta', async () => {
    fetch.mockResolvedValue(jsonResponse([]));
    await listReviews('a/b');
    expect(fetch.mock.calls[0][0]).toBe('/api/adoptions/a%2Fb/reviews');
  });

  it('propaga el ApiError con el mensaje del back', async () => {
    fetch.mockResolvedValue(jsonResponse({ apierror: { message: 'Adoption not found' } }, 404));

    const error = await listReviews(9).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Adoption not found');
  });
});
