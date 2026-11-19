import { el, clear } from '../utils/dom.js';
import { renderEmpty } from './stateViews.js';

const MISSING_DESCRIPTION = 'Requisito sin descripción';

export function normalizeRequirement(requirement) {
  const description =
    typeof requirement?.description === 'string' ? requirement.description.trim() : '';
  return {
    description: description || MISSING_DESCRIPTION,
    mandatory: requirement?.isMandatory ?? requirement?.mandatory ?? undefined,
  };
}

export function mandatoryLabel(mandatory) {
  if (mandatory === true) return 'Obligatorio';
  if (mandatory === false) return 'Opcional';
  return null;
}


export function summarizeEligibility(requirements, checked) {
  const pending = requirements.filter(
    (requirement, index) => requirement.mandatory !== false && !checked.has(index),
  ).length;

  if (pending === 0) {
    return { ready: true, pending, text: 'Cumples todos los requisitos para iniciar la adopción.' };
  }
  const text =
    pending === 1
      ? 'Te falta 1 requisito por cumplir.'
      : `Te faltan ${pending} requisitos por cumplir.`;
  return { ready: false, pending, text };
}

function requirementItem(requirement, index, onToggle) {
  const inputId = `requirement-${index}`;
  const label = mandatoryLabel(requirement.mandatory);
  return el(
    'li',
    { class: 'requirement' },
    el('input', {
      class: 'requirement__check',
      id: inputId,
      type: 'checkbox',
      onChange: (event) => onToggle(index, event.target.checked),
    }),
    el(
      'label',
      { class: 'requirement__label', for: inputId },
      el('span', { class: 'requirement__text' }, requirement.description),
      label
        ? el(
            'span',
            {
              class: `requirement__tag requirement__tag--${requirement.mandatory ? 'mandatory' : 'optional'}`,
            },
            label,
          )
        : null,
    ),
  );
}


export function renderRequirementList(container, rawRequirements) {
  if (rawRequirements.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay requisitos registrados',
      text: 'Cuando el refugio los registre, aparecerán aquí.',
    });
    return;
  }

  const requirements = rawRequirements.map(normalizeRequirement);
  const checked = new Set();
  const summary = el('p', { class: 'requirements-summary', role: 'status' });

  function updateSummary() {
    const { ready, text } = summarizeEligibility(requirements, checked);
    summary.textContent = text;
    summary.classList.toggle('requirements-summary--ready', ready);
  }

  function toggle(index, isChecked) {
    if (isChecked) checked.add(index);
    else checked.delete(index);
    updateSummary();
  }

  updateSummary();
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'p',
      { class: 'requirements-hint' },
      'Marca los requisitos que cumples para saber si estás en condiciones de adoptar. Es solo una guía: el refugio confirmará tu situación durante el proceso.',
    ),
    summary,
    el(
      'ul',
      { class: 'requirement-list', 'aria-label': 'Requisitos de adopción' },
      ...requirements.map((requirement, index) => requirementItem(requirement, index, toggle)),
    ),
  );
}
