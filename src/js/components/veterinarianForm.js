import { el } from '../utils/dom.js';

const FIELD_NAMES = ['name', 'speciality', 'email', 'phone', 'availability', 'shelterId'];

const fieldId = (name) => `veterinarian-${name}`;
const errorId = (name) => `${fieldId(name)}-error`;

const shelterLabel = (shelter) => `${shelter.name} · ${shelter.city}`;

function buildField(label, name, control) {
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

export function createVeterinarianForm({ onSubmit }) {
  const shelterSelect = el(
    'select',
    { class: 'form-select', id: fieldId('shelterId'), name: 'shelterId', required: true },
    el('option', { value: '' }, 'Selecciona un refugio'),
  );
  const submitButton = el(
    'button',
    { class: 'btn btn-primary w-100', type: 'submit' },
    'Registrar',
  );
  const form = el(
    'form',
    {
      id: 'veterinarian-form',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        onSubmit(Object.fromEntries(new FormData(form)));
      },
    },
    buildField(
      'Nombre',
      'name',
      el('input', {
        class: 'form-control',
        id: fieldId('name'),
        name: 'name',
        type: 'text',
        autocomplete: 'name',
        required: true,
      }),
    ),
    buildField(
      'Especialidad',
      'speciality',
      el('input', {
        class: 'form-control',
        id: fieldId('speciality'),
        name: 'speciality',
        type: 'text',
        placeholder: 'Medicina general, Cirugía…',
        required: true,
      }),
    ),
    buildField(
      'Correo (opcional)',
      'email',
      el('input', {
        class: 'form-control',
        id: fieldId('email'),
        name: 'email',
        type: 'email',
        autocomplete: 'email',
      }),
    ),
    buildField(
      'Teléfono (opcional)',
      'phone',
      el('input', {
        class: 'form-control',
        id: fieldId('phone'),
        name: 'phone',
        type: 'tel',
        autocomplete: 'tel',
      }),
    ),
    buildField(
      'Disponibilidad (opcional)',
      'availability',
      el('input', {
        class: 'form-control',
        id: fieldId('availability'),
        name: 'availability',
        type: 'text',
        placeholder: 'Lunes a viernes, 8:00 a 12:00',
        maxlength: 255,
      }),
    ),
    buildField('Refugio donde trabaja', 'shelterId', shelterSelect),
    submitButton,
  );

  function setShelters(shelters) {
    shelterSelect.replaceChildren(
      el('option', { value: '' }, 'Selecciona un refugio'),
      ...shelters.map((shelter) => el('option', { value: shelter.id }, shelterLabel(shelter))),
    );
  }

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

  return { element: form, setShelters, showErrors, reset, setBusy };
}
