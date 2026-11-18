import { SEX_OPTIONS, SIZE_OPTIONS } from '../domain/petFilters.js';
import { el } from '../utils/dom.js';

function selectField(name, label, options, value, onChange) {
  const id = `filter-${name}`;
  const select = el(
    'select',
    { id, class: 'filter-field__control', name, onChange: (e) => onChange(name, e.target.value) },
    el('option', { value: '' }, 'Todos'),
    ...options.map((o) => el('option', { value: o.value, selected: o.value === value }, o.label)),
  );
  return el('div', { class: 'filter-field' }, el('label', { for: id }, label), select);
}

function numberField(name, label, value, onChange) {
  const id = `filter-${name}`;
  const input = el('input', {
    id,
    class: 'filter-field__control',
    name,
    type: 'number',
    min: 0,
    max: 40,
    step: 1,
    inputmode: 'numeric',
    value,
    onChange: (e) => onChange(name, e.target.value),
  });
  return el('div', { class: 'filter-field' }, el('label', { for: id }, label), input);
}

function checkField(name, label, checked, onChange) {
  const id = `filter-${name}`;
  return el(
    'label',
    { class: 'filter-check', for: id },
    el('input', {
      id,
      type: 'checkbox',
      name,
      checked,
      onChange: (e) => onChange(name, e.target.checked),
    }),
    label,
  );
}

const LEVEL_LABELS = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' };

export function createPetFilterForm({ choices, filters, onChange, onReset }) {
  const toOptions = (values) =>
    values.map((value) => ({ value, label: LEVEL_LABELS[value] ?? value }));
  return el(
    'form',
    {
      class: 'filter-form',
      'aria-label': 'Filtros de mascotas',
      onSubmit: (e) => e.preventDefault(),
    },
    selectField(
      'species',
      'Especie',
      (choices.species ?? []).map((value) => ({ value, label: value })),
      filters.species,
      onChange,
    ),
    numberField('minAge', 'Edad mínima (años)', filters.minAge, onChange),
    numberField('maxAge', 'Edad máxima (años)', filters.maxAge, onChange),
    selectField(
      'activityLevel',
      'Nivel de actividad',
      toOptions(choices.activityLevel),
      filters.activityLevel,
      onChange,
    ),
    selectField(
      'spaceRequirement',
      'Espacio requerido',
      toOptions(choices.spaceRequirement),
      filters.spaceRequirement,
      onChange,
    ),
    selectField('size', 'Tamaño', SIZE_OPTIONS, filters.size, onChange),
    selectField('sex', 'Sexo', SEX_OPTIONS, filters.sex, onChange),
    el(
      'fieldset',
      { class: 'filter-checks' },
      el('legend', {}, 'Compatibilidad'),
      checkField('children', 'Compatible con niños', filters.children, onChange),
      checkField('otherPets', 'Compatible con otras mascotas', filters.otherPets, onChange),
    ),
    el(
      'button',
      { class: 'btn btn--outline', type: 'button', onClick: onReset },
      'Limpiar filtros',
    ),
  );
}
