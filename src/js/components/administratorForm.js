import { el } from '../utils/dom.js';
import { ADMINISTRATOR_ROLES } from '../domain/administratorRoles.js';

const FIELD_NAMES = ['name', 'email', 'role'];

const fieldId = (name) => `administrator-${name}`;
const errorId = (name) => `${fieldId(name)}-error`;

const FIELDS = [
  {
    name: 'name',
    label: 'Nombre',
    createControl: (name) =>
      el('input', {
        class: 'form-control',
        id: fieldId(name),
        name,
        type: 'text',
        autocomplete: 'name',
        required: true,
      }),
  },
  {
    name: 'email',
    label: 'Correo electrónico',
    createControl: (name) =>
      el('input', {
        class: 'form-control',
        id: fieldId(name),
        name,
        type: 'email',
        autocomplete: 'email',
        required: true,
      }),
  },
  {
    name: 'role',
    label: 'Rol',
    createControl: (name) =>
      el(
        'select',
        { class: 'form-select', id: fieldId(name), name, required: true },
        el('option', { value: '' }, 'Selecciona un rol'),
        ...ADMINISTRATOR_ROLES.map((role) => el('option', { value: role.value }, role.label)),
      ),
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
 * Formulario de registro de administradores (Bootstrap).
 * Devuelve el elemento y las operaciones que la página necesita para controlarlo.
 */
export function createAdministratorForm({ onSubmit }) {
  const submitButton = el(
    'button',
    { class: 'btn btn-primary w-100', type: 'submit' },
    'Registrar',
  );
  const form = el(
    'form',
    {
      id: 'administrator-form',
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
