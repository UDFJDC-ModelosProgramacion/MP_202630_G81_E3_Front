import { beforeEach, describe, expect, it } from 'vitest';
import { renderReviewList, toStars } from '../src/js/components/reviewList.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('toStars', () => {
  it.each([
    ['5', 5],
    ['3', 3],
    ['3.6', 4],
    ['9', 5],
    ['-2', 0],
    ['abc', 0],
    [undefined, 0],
  ])('la calificación %s se muestra con %i estrellas', (score, expected) => {
    expect(toStars(score)).toBe(expected);
  });
});

describe('renderReviewList', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('muestra el estado vacío cuando no hay reseñas', () => {
    renderReviewList(container, []);

    expect(container.querySelector('.state__title').textContent).toBe('Aún no hay reseñas');
    expect(container.querySelector('.review-card')).toBeNull();
  });

  it('pinta una tarjeta por reseña con su comentario y calificación', () => {
    renderReviewList(container, [
      { id: 1, comments: 'Mi perro es feliz', score: '4' },
      { id: 2, comments: 'Proceso muy claro', score: '5' },
    ]);

    const cards = container.querySelectorAll('.review-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.review-card__comment').textContent).toBe('Mi perro es feliz');
    const score = cards[0].querySelector('.review-card__score');
    expect(score.getAttribute('aria-label')).toBe('Calificación: 4 de 5');
    expect(score.textContent).toBe('★★★★☆');
    expect(cards[1].querySelector('.review-card__score').textContent).toBe('★★★★★');
  });

  it('inserta los comentarios como texto y no como HTML', () => {
    renderReviewList(container, [{ id: 1, comments: '<img src=x onerror=alert(1)>', score: '3' }]);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.review-card__comment').textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('reemplaza el estado de carga anterior y deja de estar ocupado', () => {
    renderLoading(container);
    renderReviewList(container, [{ id: 1, comments: 'Bien', score: '5' }]);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelectorAll('.review-list')).toHaveLength(1);
  });

  it('reemplaza el estado vacío cuando llegan reseñas', () => {
    renderReviewList(container, []);
    renderReviewList(container, [{ id: 1, comments: 'Bien', score: '5' }]);

    expect(container.querySelector('.state')).toBeNull();
    expect(container.querySelectorAll('.review-card')).toHaveLength(1);
  });
});
