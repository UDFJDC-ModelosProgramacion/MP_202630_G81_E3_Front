import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import {
  MAX_COMMENT_LENGTH,
  MAX_SCORE,
  renderReviewForm,
  validateReview,
} from '../src/js/components/reviewForm.js';
import { until } from './helpers.js';

describe('validateReview', () => {
  it('acepta una reseña válida', () => {
    expect(validateReview({ comments: 'Muy buena experiencia', score: '5' })).toEqual({});
  });

  it.each([undefined, null, '', '   '])('rechaza el comentario vacío (%s)', (comments) => {
    expect(validateReview({ comments, score: '3' })).toEqual({
      comments: 'Escribe un comentario sobre tu experiencia.',
    });
  });

  it('acepta un comentario del largo máximo y rechaza uno más largo', () => {
    expect(validateReview({ comments: 'a'.repeat(MAX_COMMENT_LENGTH), score: '3' })).toEqual({});
    const { comments } = validateReview({
      comments: 'a'.repeat(MAX_COMMENT_LENGTH + 1),
      score: '3',
    });
    expect(comments).toContain(String(MAX_COMMENT_LENGTH));
  });

  it.each(['1', '5', 3])('acepta la calificación %s', (score) => {
    expect(validateReview({ comments: 'Bien', score })).toEqual({});
  });

  it.each([undefined, null, '', '0', '6', '2.5', 'abc'])('rechaza la calificación %s', (score) => {
    expect(validateReview({ comments: 'Bien', score }).score).toBe(
      `Elige una calificación de 1 a ${MAX_SCORE}.`,
    );
  });

  it('informa los dos errores a la vez', () => {
    expect(Object.keys(validateReview({ comments: '', score: '' }))).toEqual([
      'comments',
      'score',
    ]);
  });
});

describe('renderReviewForm', () => {
  let mount;
  let onSubmit;

  function fill({ comments, score } = {}) {
    if (comments !== undefined) mount.querySelector('#review-comments').value = comments;
    if (score !== undefined) mount.querySelector(`#review-score-${score}`).checked = true;
  }

  function submit() {
    mount
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  const text = (selector) => mount.querySelector(selector).textContent;

  beforeEach(() => {
    document.body.innerHTML = '<div id="mount"></div>';
    mount = document.getElementById('mount');
    onSubmit = vi.fn().mockResolvedValue(undefined);
    renderReviewForm(mount, { onSubmit });
  });

  it('pinta el comentario, las cinco calificaciones y el botón', () => {
    expect(mount.querySelector('#review-comments').required).toBe(true);
    expect(mount.querySelectorAll('input[name="score"]')).toHaveLength(MAX_SCORE);
    expect(mount.querySelector('button[type="submit"]').textContent).toBe('Publicar reseña');
  });

  it('no duplica el formulario al repintar', () => {
    renderReviewForm(mount, { onSubmit });
    expect(mount.querySelectorAll('form')).toHaveLength(1);
  });

  it('con el formulario vacío muestra ambos errores y enfoca el comentario', () => {
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(text('#review-comments-error')).toBe('Escribe un comentario sobre tu experiencia.');
    expect(text('#review-score-error')).toBe('Elige una calificación de 1 a 5.');
    expect(mount.querySelector('#review-comments').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(mount.querySelector('#review-comments'));
  });

  it('si solo falta la calificación, enfoca la primera opción', () => {
    fill({ comments: 'Todo muy bien' });
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(text('#review-comments-error')).toBe('');
    expect(mount.querySelector('#review-comments').getAttribute('aria-invalid')).toBe('false');
    expect(text('#review-score-error')).toBe('Elige una calificación de 1 a 5.');
    expect(document.activeElement).toBe(mount.querySelector('#review-score-1'));
  });

  it('envía los datos sin espacios sobrantes y muestra el mensaje de éxito', async () => {
    fill({ comments: '  Excelente  ', score: 4 });
    submit();

    await until(() => text('.form-feedback--success') !== '');
    expect(onSubmit).toHaveBeenCalledWith({ comments: 'Excelente', score: '4' });
    expect(text('.form-feedback--success')).toBe('Gracias, tu reseña fue publicada.');
    expect(mount.querySelector('#review-comments').value).toBe('');
    expect(mount.querySelector('input[name="score"]:checked')).toBeNull();
  });

  it('limpia los errores anteriores al corregir y reenviar', async () => {
    submit();
    fill({ comments: 'Bien', score: 2 });
    submit();

    await until(() => onSubmit.mock.calls.length === 1);
    expect(text('#review-comments-error')).toBe('');
    expect(text('#review-score-error')).toBe('');
  });

  it('bloquea el botón mientras se publica', async () => {
    let finish;
    onSubmit.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const button = mount.querySelector('button[type="submit"]');
    fill({ comments: 'Bien', score: 5 });

    submit();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Publicando…');
    expect(mount.querySelector('form').getAttribute('aria-busy')).toBe('true');

    finish();
    await until(() => !button.disabled);
    expect(button.textContent).toBe('Publicar reseña');
    expect(mount.querySelector('form').getAttribute('aria-busy')).toBe('false');
  });

  it('muestra el mensaje del back y conserva lo escrito si falla', async () => {
    onSubmit.mockRejectedValue(new ApiError('Adoption not found', { status: 404 }));
    fill({ comments: 'Bien', score: 3 });

    submit();

    await until(() => text('.form-feedback--error') !== '');
    expect(text('.form-feedback--error')).toBe('Adoption not found');
    expect(text('.form-feedback--success')).toBe('');
    expect(mount.querySelector('#review-comments').value).toBe('Bien');
    expect(mount.querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it('usa un mensaje genérico ante un error inesperado', async () => {
    onSubmit.mockRejectedValue(new Error('boom'));
    fill({ comments: 'Bien', score: 3 });

    submit();

    await until(() => text('.form-feedback--error') !== '');
    expect(text('.form-feedback--error')).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
