import { beforeEach, describe, expect, it } from 'vitest';
import {
  mandatoryLabel,
  normalizeRequirement,
  renderRequirementList,
  summarizeEligibility,
} from '../src/js/components/requirementList.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('normalizeRequirement', () => {
  it('toma la descripción sin espacios y si es obligatorio', () => {
    expect(normalizeRequirement({ description: '  Patio  ', isMandatory: true })).toEqual({
      description: 'Patio',
      mandatory: true,
    });
  });

  it('acepta el campo mandatory del back', () => {
    expect(normalizeRequirement({ description: 'A', mandatory: false }).mandatory).toBe(false);
  });

  it.each([[{ description: '  ' }], [{}], [null], [{ description: 5 }]])(
    'sin descripción (%j) usa un texto por defecto y no define si es obligatorio',
    (requirement) => {
      expect(normalizeRequirement(requirement)).toEqual({
        description: 'Requisito sin descripción',
        mandatory: undefined,
      });
    },
  );
});

describe('mandatoryLabel', () => {
  it.each([
    [true, 'Obligatorio'],
    [false, 'Opcional'],
    [undefined, null],
    [null, null],
  ])('%s → %s', (value, expected) => {
    expect(mandatoryLabel(value)).toBe(expected);
  });
});

describe('summarizeEligibility', () => {
  const requirements = [{ mandatory: true }, { mandatory: false }, { mandatory: undefined }];

  it('cuenta como pendientes los obligatorios y los que no se sabe', () => {
    expect(summarizeEligibility(requirements, new Set())).toEqual({
      ready: false,
      pending: 2,
      text: 'Te faltan 2 requisitos por cumplir.',
    });
  });

  it('usa el singular cuando falta uno', () => {
    expect(summarizeEligibility(requirements, new Set([0])).text).toBe(
      'Te falta 1 requisito por cumplir.',
    );
  });

  it('está listo cuando solo quedan opcionales sin marcar', () => {
    expect(summarizeEligibility(requirements, new Set([0, 2]))).toEqual({
      ready: true,
      pending: 0,
      text: 'Cumples todos los requisitos para iniciar la adopción.',
    });
  });
});

describe('renderRequirementList', () => {
  let container;

  const REQUIREMENTS = [
    { id: 1, description: 'Tener casa propia con patio cerrado.', isMandatory: true },
    { id: 2, description: 'Visitas de seguimiento.', isMandatory: false },
    { id: 3, description: 'Ser mayor de edad.' },
  ];

  const check = (index) => {
    const input = container.querySelector(`#requirement-${index}`);
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const summary = () => container.querySelector('.requirements-summary');

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('muestra el estado vacío cuando no hay requisitos', () => {
    renderRequirementList(container, []);

    expect(container.querySelector('.state__title').textContent).toBe(
      'Aún no hay requisitos registrados',
    );
    expect(container.querySelector('.requirement')).toBeNull();
  });

  it('pinta un requisito por elemento, con su descripción y casilla', () => {
    renderRequirementList(container, REQUIREMENTS);

    const items = container.querySelectorAll('.requirement');
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('.requirement__text').textContent).toBe(
      'Tener casa propia con patio cerrado.',
    );
    expect(items[0].querySelector('label').getAttribute('for')).toBe('requirement-0');
    expect(items[0].querySelector('input').type).toBe('checkbox');
  });

  it('etiqueta cada requisito como obligatorio u opcional solo si se sabe', () => {
    renderRequirementList(container, REQUIREMENTS);

    const tags = [...container.querySelectorAll('.requirement')].map(
      (item) => item.querySelector('.requirement__tag')?.textContent ?? null,
    );
    expect(tags).toEqual(['Obligatorio', 'Opcional', null]);
  });

  it('indica cuántos requisitos faltan y se actualiza al marcarlos', () => {
    renderRequirementList(container, REQUIREMENTS);
    expect(summary().textContent).toBe('Te faltan 2 requisitos por cumplir.');
    expect(summary().classList.contains('requirements-summary--ready')).toBe(false);

    check(0);
    expect(summary().textContent).toBe('Te falta 1 requisito por cumplir.');

    check(2);
    expect(summary().textContent).toBe('Cumples todos los requisitos para iniciar la adopción.');
    expect(summary().classList.contains('requirements-summary--ready')).toBe(true);
  });

  it('vuelve a contar como pendiente un requisito que se desmarca', () => {
    renderRequirementList(container, REQUIREMENTS);
    check(0);
    check(0);

    expect(summary().textContent).toBe('Te faltan 2 requisitos por cumplir.');
  });

  it('inserta las descripciones como texto y no como HTML', () => {
    renderRequirementList(container, [{ description: '<img src=x onerror=alert(1)>' }]);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.requirement__text').textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderRequirementList(container, REQUIREMENTS);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelectorAll('.requirement-list')).toHaveLength(1);
  });
});
