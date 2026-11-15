import { REASON_MAX_LENGTH } from '../domain/devolution.js';
import { el } from '../utils/dom.js';

const FIELD_NAMES = ['date', 'reason'];

const fieldId = (name) => `devolution-${name}`;
const errorId = (name) => `${fieldId(name)}-error`;

const FIELDS = [
  {
    name: 'date',
    label: 'Fecha de la devolución',
    createControl: (name) =>
      el('input', { class: 'form-control', id: fieldId(name), name, type: 'date', required: true }),
  },
  {
    name: 'reason',
    label: 'Motivo',
    createControl: (name) =>
      el('textarea', {
        class: 'form-control',
        id: fieldId(name),
        name,
        rows: 4,
        maxlength: REASON_MAX_LENGTH,
        required: true,
      }),
  },
];

function buildField({ name, label, createControl }) {
  const control = createControl(name);
  control.setAttribute('aria-describedby', errorId(name));
  return el(
    'div',
    { class: 'mb-3' },
    el('label', { class: 'form-label', for: fieldId(name) }, label),
    control,
    el('div', { class: 'invalid-feedback', id: errorId(name) }),
  );
}

function applyFieldError(form, name, message) {
  const control = form.querySelector(`#${fieldId(name)}`);
  control.classList.toggle('is-invalid', Boolean(message));
  control.setAttribute('aria-invalid', String(Boolean(message)));
  form.querySelector(`#${errorId(name)}`).textContent = message ?? '';
}

/**
 * Formulario de registro de una devolución (Bootstrap).
 * Devuelve el elemento y las operaciones que la página necesita para controlarlo.
 */
export function createDevolutionForm({ onSubmit }) {
  const submitButton = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Registrar');
  const form = el(
    'form',
    {
      id: 'devolution-form',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        onSubmit(Object.fromEntries(new FormData(form)));
      },
    },
    ...FIELDS.map(buildField),
    submitButton,
  );

  function showErrors(errors) {
    FIELD_NAMES.forEach((name) => applyFieldError(form, name, errors[name]));
    form.querySelector('.is-invalid')?.focus();
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.textContent = busy ? 'Registrando…' : 'Registrar';
  }

  return { element: form, showErrors, setBusy };
}
