import { GENDERS, MAX_AGE, MIN_AGE } from '../domain/veterinarians.js';
import { el } from '../utils/dom.js';

const FIELD_NAMES = ['name', 'speciality', 'age', 'gender', 'shelterId'];

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

/**
 * Formulario de registro de veterinarios (Bootstrap).
 * `setShelters` llena el selector de refugios cuando la página termina de cargarlos.
 */
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
      'Edad',
      'age',
      el('input', {
        class: 'form-control',
        id: fieldId('age'),
        name: 'age',
        type: 'number',
        min: MIN_AGE,
        max: MAX_AGE,
        step: 1,
        inputmode: 'numeric',
        required: true,
      }),
    ),
    buildField(
      'Género',
      'gender',
      el(
        'select',
        { class: 'form-select', id: fieldId('gender'), name: 'gender', required: true },
        el('option', { value: '' }, 'Selecciona el género'),
        ...GENDERS.map((gender) => el('option', { value: gender.value }, gender.label)),
      ),
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
