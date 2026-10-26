import { el, clear } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const MAX_SCORE = 5;
// ReviewEntity.comments es un String de JPA: la columna por defecto admite 255 caracteres.
export const MAX_COMMENT_LENGTH = 255;

const SUBMIT_LABEL = 'Publicar reseña';

/** Devuelve un objeto con un mensaje por cada campo inválido; vacío si todo está bien. */
export function validateReview({ comments, score }) {
  const errors = {};
  const text = String(comments ?? '').trim();
  if (!text) {
    errors.comments = 'Escribe un comentario sobre tu experiencia.';
  } else if (text.length > MAX_COMMENT_LENGTH) {
    errors.comments = `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres.`;
  }

  const value = Number(score);
  if (!Number.isInteger(value) || value < 1 || value > MAX_SCORE) {
    errors.score = `Elige una calificación de 1 a ${MAX_SCORE}.`;
  }
  return errors;
}

function fieldError(id) {
  return el('p', { class: 'field__error', id });
}

function ratingOption(value) {
  const id = `review-score-${value}`;
  return [
    el('input', { class: 'rating__input', type: 'radio', id, name: 'score', value }),
    el(
      'label',
      { class: 'rating__label', for: id },
      String(value),
      el('span', { 'aria-hidden': 'true' }, '★'),
    ),
  ];
}

function readValues(form) {
  const data = new FormData(form);
  return {
    comments: String(data.get('comments')).trim(),
    score: data.get('score') ?? '',
  };
}

/**
 * Pinta el formulario de reseña.
 *
 * @param {HTMLElement} mount  contenedor donde se pinta
 * @param {{ onSubmit: (review: { comments: string, score: string }) => Promise<void> }} options
 *   `onSubmit` recibe los datos ya validados; si lanza un error, el formulario lo muestra.
 */
export function renderReviewForm(mount, { onSubmit }) {
  const comments = el('textarea', {
    class: 'field__control',
    id: 'review-comments',
    name: 'comments',
    rows: 4,
    maxlength: MAX_COMMENT_LENGTH,
    required: true,
    'aria-describedby': 'review-comments-error',
  });
  const commentsError = fieldError('review-comments-error');
  const scoreError = fieldError('review-score-error');
  const success = el('p', { class: 'form-feedback form-feedback--success', role: 'status' });
  const failure = el('p', { class: 'form-feedback form-feedback--error', role: 'alert' });
  const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, SUBMIT_LABEL);

  function showErrors(errors) {
    commentsError.textContent = errors.comments ?? '';
    comments.setAttribute('aria-invalid', errors.comments ? 'true' : 'false');
    scoreError.textContent = errors.score ?? '';
  }

  function setPending(pending) {
    submit.disabled = pending;
    submit.textContent = pending ? 'Publicando…' : SUBMIT_LABEL;
    form.setAttribute('aria-busy', pending ? 'true' : 'false');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    success.textContent = '';
    failure.textContent = '';

    const values = readValues(form);
    const errors = validateReview(values);
    showErrors(errors);
    if (errors.comments) {
      comments.focus();
      return;
    }
    if (errors.score) {
      form.querySelector('input[name="score"]').focus();
      return;
    }

    setPending(true);
    try {
      await onSubmit(values);
      form.reset();
      success.textContent = 'Gracias, tu reseña fue publicada.';
    } catch (error) {
      failure.textContent = friendlyMessage(error);
    } finally {
      setPending(false);
    }
  }

  const form = el(
    'form',
    {
      class: 'review-form',
      novalidate: true,
      'aria-labelledby': 'review-form-title',
      onSubmit: handleSubmit,
    },
    el('h2', { class: 'review-form__title', id: 'review-form-title' }, 'Cuéntanos tu experiencia'),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: 'review-comments' }, 'Comentario'),
      comments,
      commentsError,
    ),
    el(
      'fieldset',
      { class: 'field', 'aria-describedby': 'review-score-error' },
      el('legend', { class: 'field__label' }, 'Calificación'),
      el('p', { class: 'field__hint' }, `1 = muy mala, ${MAX_SCORE} = excelente`),
      el(
        'div',
        { class: 'rating' },
        ...Array.from({ length: MAX_SCORE }, (_, index) => ratingOption(index + 1)),
      ),
      scoreError,
    ),
    failure,
    success,
    submit,
  );

  clear(mount).append(form);
  return form;
}
