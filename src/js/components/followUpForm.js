import {
  ADAPTATION_STATUSES,
  MAX_OBSERVATIONS_LENGTH,
  todayIso,
  validateFollowUp,
} from '../domain/followUps.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const SUBMIT_LABEL = 'Guardar seguimiento';
const FIELDS = ['date', 'adaptationStatus', 'observations'];
const MISSING_MESSAGE = 'Revisa los campos marcados: falta información obligatoria.';

const fieldError = (id) => el('p', { class: 'field__error', id });

/**
 * Pinta el formulario de seguimiento (fecha, estado de adaptación y observaciones).
 * No guarda un registro incompleto: muestra qué falta y no llama a `onSubmit`.
 *
 * @param {HTMLElement} mount
 * @param {{ onSubmit: (followUp: FollowUpInput) => Promise<void>, today?: () => string }} options
 *   `onSubmit` recibe los datos ya validados; si lanza un error, el formulario lo muestra.
 *
 * @typedef {{ date: string, adaptationStatus: string, observations: string }} FollowUpInput
 */
export function renderFollowUpForm(mount, { onSubmit, today = todayIso }) {
  const date = el('input', {
    class: 'field__control',
    id: 'followup-date',
    name: 'date',
    type: 'date',
    max: today(),
    value: today(),
    required: true,
    'aria-describedby': 'followup-date-error',
  });
  const status = el(
    'select',
    {
      class: 'field__control',
      id: 'followup-status',
      name: 'adaptationStatus',
      required: true,
      'aria-describedby': 'followup-status-error',
    },
    el('option', { value: '' }, 'Selecciona un estado'),
    ...ADAPTATION_STATUSES.map(({ value, label }) => el('option', { value }, label)),
  );
  const observations = el('textarea', {
    class: 'field__control',
    id: 'followup-observations',
    name: 'observations',
    rows: 4,
    maxlength: MAX_OBSERVATIONS_LENGTH,
    required: true,
    'aria-describedby': 'followup-observations-error',
  });
  const controls = { date, adaptationStatus: status, observations };
  const errorNodes = {
    date: fieldError('followup-date-error'),
    adaptationStatus: fieldError('followup-status-error'),
    observations: fieldError('followup-observations-error'),
  };
  const summary = el('p', { class: 'form-feedback form-feedback--error', role: 'alert' });
  const success = el('p', { class: 'form-feedback form-feedback--success', role: 'status' });
  const failure = el('p', { class: 'form-feedback form-feedback--error', role: 'alert' });
  const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, SUBMIT_LABEL);

  function showErrors(errors) {
    for (const field of FIELDS) {
      errorNodes[field].textContent = errors[field] ?? '';
      controls[field].setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
    }
    summary.textContent = Object.keys(errors).length ? MISSING_MESSAGE : '';
  }

  function setPending(pending) {
    submit.disabled = pending;
    submit.textContent = pending ? 'Guardando…' : SUBMIT_LABEL;
    form.setAttribute('aria-busy', pending ? 'true' : 'false');
  }

  const readValues = () => ({
    date: date.value.trim(),
    adaptationStatus: status.value,
    observations: observations.value.trim(),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    success.textContent = '';
    failure.textContent = '';

    const values = readValues();
    const errors = validateFollowUp(values, today());
    showErrors(errors);
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      controls[firstInvalid].focus();
      return;
    }

    setPending(true);
    try {
      await onSubmit(values);
      form.reset();
      date.value = today();
      success.textContent = 'Seguimiento registrado.';
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
      'aria-labelledby': 'followup-form-title',
      onSubmit: handleSubmit,
    },
    el('h2', { class: 'review-form__title', id: 'followup-form-title' }, 'Registrar seguimiento'),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: 'followup-date' }, 'Fecha'),
      date,
      errorNodes.date,
    ),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: 'followup-status' }, 'Estado de adaptación'),
      status,
      errorNodes.adaptationStatus,
    ),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: 'followup-observations' }, 'Observaciones'),
      observations,
      errorNodes.observations,
    ),
    summary,
    failure,
    success,
    submit,
  );

  clear(mount).append(form);
  return form;
}
