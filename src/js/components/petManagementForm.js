import {
  ACTIVITY_LEVELS,
  MAX_AGE,
  MAX_NAME_LENGTH,
  MAX_TEXT_LENGTH,
  PET_STATUSES,
  SEX_OPTIONS,
  SIZE_OPTIONS,
  SPACE_REQUIREMENTS,
  emptyPetValues,
  validatePetValues,
} from '../domain/petManagement.js';
import { todayIso } from '../domain/followUps.js';
import { el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const ID_PREFIX = 'pet-';
const fieldId = (name) => `${ID_PREFIX}${name}`;
const errorId = (name) => `${fieldId(name)}-error`;
const MISSING_MESSAGE = 'Revisa los campos marcados: falta información obligatoria.';

const options = (items, placeholder) => [
  el('option', { value: '' }, placeholder),
  ...items.map((item) =>
    typeof item === 'string'
      ? el('option', { value: item }, item)
      : el('option', { value: item.value }, item.label),
  ),
];

/**
 * Formulario de registro y edición de mascotas (Bootstrap).
 *
 * - Valida antes de enviar: marca los campos que faltan y no llama a `onSubmit`.
 * - Evita duplicados: mientras un envío está en curso ignora los envíos repetidos (doble clic,
 *   Enter repetido) y deshabilita el botón, de modo que un mismo envío crea un único registro.
 *
 * @param {{
 *   shelters: Array<{ id: number, name: string, city?: string }>,
 *   values?: object,            valores iniciales (edición); por defecto, mascota nueva
 *   isNew?: boolean,            true registra; false actualiza
 *   onSubmit: (values: object) => Promise<void>,
 *   onCancel?: () => void,
 *   today?: () => string,
 * }} config
 * @returns {{ element: HTMLFormElement, isPending: () => boolean }}
 */
export function createPetManagementForm({
  shelters,
  values,
  isNew = true,
  onSubmit,
  onCancel,
  today = todayIso,
}) {
  const initial = values ?? emptyPetValues(today());
  let pending = false;

  const controls = {
    name: el('input', {
      class: 'form-control',
      type: 'text',
      maxlength: MAX_NAME_LENGTH,
      required: true,
    }),
    status: el(
      'select',
      { class: 'form-select', required: true },
      ...options(PET_STATUSES, 'Elige…'),
    ),
    age: el('input', {
      class: 'form-control',
      type: 'number',
      min: 0,
      max: MAX_AGE,
      step: 1,
      required: true,
    }),
    sex: el('select', { class: 'form-select', required: true }, ...options(SEX_OPTIONS, 'Elige…')),
    size: el(
      'select',
      { class: 'form-select', required: true },
      ...options(SIZE_OPTIONS, 'Elige…'),
    ),
    shelterId: el(
      'select',
      { class: 'form-select', required: true },
      ...options(
        shelters.map((shelter) => ({
          value: String(shelter.id),
          label: shelter.city ? `${shelter.name} · ${shelter.city}` : shelter.name,
        })),
        'Elige el refugio…',
      ),
    ),
    temperament: el('input', { class: 'form-control', type: 'text', maxlength: MAX_TEXT_LENGTH }),
    description: el('textarea', { class: 'form-control', rows: 2, maxlength: MAX_TEXT_LENGTH }),
    specialNeeds: el('input', { class: 'form-control', type: 'text', maxlength: MAX_TEXT_LENGTH }),
    activityLevel: el(
      'select',
      { class: 'form-select' },
      ...options(ACTIVITY_LEVELS, 'Sin definir'),
    ),
    spaceRequirement: el(
      'select',
      { class: 'form-select' },
      ...options(SPACE_REQUIREMENTS, 'Sin definir'),
    ),
    arrivalDate: el('input', { class: 'form-control', type: 'date', max: today(), required: true }),
    arrivalDescription: el('textarea', {
      class: 'form-control',
      rows: 2,
      maxlength: MAX_TEXT_LENGTH,
      required: true,
    }),
  };
  const checks = {
    compatibleWithChildren: el('input', { class: 'form-check-input', type: 'checkbox' }),
    compatibleWithOtherPets: el('input', { class: 'form-check-input', type: 'checkbox' }),
  };

  const fieldNames = Object.keys(controls);
  const errorNodes = {};
  for (const name of fieldNames) {
    controls[name].id = fieldId(name);
    controls[name].name = name;
    controls[name].setAttribute('aria-describedby', errorId(name));
    errorNodes[name] = el('div', { class: 'invalid-feedback', id: errorId(name) });
  }
  for (const [name, check] of Object.entries(checks)) {
    check.id = fieldId(name);
    check.name = name;
  }

  function field(name, label, { col = 'col-md-6' } = {}) {
    return el(
      'div',
      { class: col },
      el('label', { class: 'form-label', for: fieldId(name) }, label),
      controls[name],
      errorNodes[name],
    );
  }
  const checkField = (name, label) =>
    el(
      'div',
      { class: 'form-check' },
      checks[name],
      el('label', { class: 'form-check-label', for: fieldId(name) }, label),
    );

  const summary = el('div', { class: 'alert alert-danger py-2', role: 'alert', hidden: true });
  const failure = el('div', { class: 'alert alert-danger py-2', role: 'alert', hidden: true });
  const submit = el(
    'button',
    { class: 'btn btn-primary', type: 'submit' },
    isNew ? 'Registrar mascota' : 'Guardar cambios',
  );

  function setValues(next) {
    for (const name of fieldNames) controls[name].value = String(next[name] ?? '');
    for (const name of Object.keys(checks)) checks[name].checked = next[name] === true;
  }

  function readValues() {
    const read = {};
    for (const name of fieldNames) read[name] = controls[name].value.trim();
    for (const name of Object.keys(checks)) read[name] = checks[name].checked;
    return read;
  }

  function showErrors(errors) {
    for (const name of fieldNames) {
      const message = errors[name];
      controls[name].classList.toggle('is-invalid', Boolean(message));
      controls[name].setAttribute('aria-invalid', message ? 'true' : 'false');
      errorNodes[name].textContent = message ?? '';
    }
    const hasErrors = Object.keys(errors).length > 0;
    summary.hidden = !hasErrors;
    summary.textContent = hasErrors ? MISSING_MESSAGE : '';
  }

  function setPending(value) {
    pending = value;
    submit.disabled = value;
    submit.textContent = value ? 'Guardando…' : isNew ? 'Registrar mascota' : 'Guardar cambios';
    form.setAttribute('aria-busy', String(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Envío repetido mientras el anterior sigue en curso: no se crea otro registro.
    if (pending) return;
    failure.hidden = true;

    const read = readValues();
    const errors = validatePetValues(read, { isNew, today: today() });
    showErrors(errors);
    const firstInvalid = fieldNames.find((name) => errors[name]);
    if (firstInvalid) {
      controls[firstInvalid].focus();
      return;
    }

    setPending(true);
    try {
      await onSubmit(read);
      if (isNew) {
        setValues(emptyPetValues(today()));
        showErrors({});
      }
    } catch (error) {
      failure.textContent = friendlyMessage(error);
      failure.hidden = false;
    } finally {
      setPending(false);
    }
  }

  const arrivalSection = isNew
    ? [
        el('h3', { class: 'h6 mt-2' }, 'Llegada al refugio'),
        field('arrivalDate', 'Fecha de llegada'),
        field('arrivalDescription', 'Descripción de la llegada'),
      ]
    : [];

  const form = el(
    'form',
    {
      id: 'pet-management-form',
      novalidate: true,
      'aria-label': isNew ? 'Registrar mascota' : 'Editar mascota',
      onSubmit: handleSubmit,
    },
    el(
      'div',
      { class: 'row g-3 mb-3' },
      field('name', 'Nombre'),
      field('shelterId', 'Refugio'),
      field('status', 'Estado', { col: 'col-md-4' }),
      field('age', 'Edad (años)', { col: 'col-md-4' }),
      field('sex', 'Sexo', { col: 'col-md-4' }),
      field('size', 'Tamaño', { col: 'col-md-4' }),
      field('activityLevel', 'Nivel de actividad', { col: 'col-md-4' }),
      field('spaceRequirement', 'Espacio requerido', { col: 'col-md-4' }),
      field('temperament', 'Temperamento', { col: 'col-12' }),
      field('description', 'Descripción', { col: 'col-12' }),
      field('specialNeeds', 'Necesidades especiales', { col: 'col-12' }),
      el(
        'div',
        { class: 'col-12 d-flex flex-wrap gap-4' },
        checkField('compatibleWithChildren', 'Compatible con niños'),
        checkField('compatibleWithOtherPets', 'Compatible con otras mascotas'),
      ),
      ...arrivalSection,
    ),
    summary,
    failure,
    el(
      'div',
      { class: 'd-flex gap-2' },
      submit,
      onCancel
        ? el(
            'button',
            { class: 'btn btn-outline-secondary', type: 'button', onClick: onCancel },
            'Cancelar',
          )
        : null,
    ),
  );

  setValues(initial);
  return { element: form, isPending: () => pending };
}
