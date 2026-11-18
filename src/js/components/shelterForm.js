import { el } from '../utils/dom.js';

const FIELD_NAMES = ['name', 'city'];

const fieldId = (name) => `shelter-form-${name}`;
const errorId = (name) => `${fieldId(name)}-error`;

const FIELDS = [
  { name: 'name', label: 'Nombre del refugio', autocomplete: 'organization' },
  { name: 'city', label: 'Ciudad', autocomplete: 'address-level2' },
];

function buildField({ name, label, autocomplete }) {
  return el(
    'div',
    { class: 'col-md-6' },
    el('label', { class: 'form-label', for: fieldId(name) }, label),
    el('input', {
      class: 'form-control',
      id: fieldId(name),
      name,
      type: 'text',
      autocomplete,
      required: true,
      'aria-describedby': errorId(name),
    }),
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
 * Formulario de registro de refugios (Bootstrap).
 * Devuelve el elemento y las operaciones que la página necesita para controlarlo.
 */
export function createShelterForm({ onSubmit }) {
  const submitButton = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Registrar');
  const form = el(
    'form',
    {
      id: 'shelter-create-form',
      novalidate: true,
      'aria-label': 'Registrar refugio',
      onSubmit: (event) => {
        event.preventDefault();
        onSubmit(Object.fromEntries(new FormData(form)));
      },
    },
    el('div', { class: 'row g-3 mb-3' }, ...FIELDS.map(buildField)),
    submitButton,
  );

  function showErrors(errors) {
    FIELD_NAMES.forEach((name) => applyFieldError(form, name, errors[name]));
    form.querySelector('.is-invalid')?.focus();
  }

  function reset() {
    form.reset();
    showErrors({});
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.textContent = busy ? 'Registrando…' : 'Registrar';
  }

  return { element: form, showErrors, reset, setBusy };
}