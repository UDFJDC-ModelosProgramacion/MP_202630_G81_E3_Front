import { beforeEach, describe, expect, it } from 'vitest';
import { renderAdoptionProcess, statusLabel } from '../src/js/components/adoptionProcess.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('statusLabel', () => {
  it.each([
    ['PENDING', 'Pendiente'],
    ['IN_PROGRESS', 'En proceso'],
    ['approved', 'Aprobada'],
    ['  COMPLETED ', 'Completada'],
  ])('traduce %s', (status, expected) => {
    expect(statusLabel(status)).toBe(expected);
  });

  it('muestra tal cual un estado desconocido', () => {
    expect(statusLabel(' Aprobado ')).toBe('Aprobado');
  });

  it.each([[undefined], [null], [''], ['   '], [5]])('sin estado (%s)', (status) => {
    expect(statusLabel(status)).toBe('Sin estado');
  });
});

describe('renderAdoptionProcess', () => {
  let container;

  const ADOPTION = {
    id: 7,
    adoptionDate: '2026-03-16',
    status: 'IN_PROGRESS',
    contract: { id: 3, signedDate: '2026-03-20T00:00:00.000+00:00', termsAndConditions: 'T' },
    requirements: [
      { id: 1, description: 'Tener patio cerrado.', isMandatory: true },
      { id: 2, description: 'Visitas de seguimiento.', isMandatory: false },
      { id: 3, description: 'Ser mayor de edad.' },
    ],
  };

  const facts = () =>
    [...container.querySelectorAll('.process__fact')].map((item) => [
      item.querySelector('dt').textContent,
      item.querySelector('dd').textContent,
    ]);

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('muestra número, fecha y estado de la adopción', () => {
    renderAdoptionProcess(container, ADOPTION);

    expect(facts()).toEqual([
      ['Adopción', 'n.º 7'],
      ['Fecha de adopción', '16 mar 2026'],
      ['Estado', 'En proceso'],
    ]);
  });

  it('lista los requisitos con su etiqueta solo cuando se sabe si son obligatorios', () => {
    renderAdoptionProcess(container, ADOPTION);

    const rows = [...container.querySelectorAll('.process-requirement')].map((item) => [
      item.querySelector('.process-requirement__text').textContent,
      item.querySelector('.process-tag')?.textContent ?? null,
    ]);
    expect(rows).toEqual([
      ['Tener patio cerrado.', 'Obligatorio'],
      ['Visitas de seguimiento.', 'Opcional'],
      ['Ser mayor de edad.', null],
    ]);
  });

  it('acepta el campo mandatory del back y usa un texto si falta la descripción', () => {
    renderAdoptionProcess(container, {
      ...ADOPTION,
      requirements: [{ mandatory: true }, null],
    });

    const texts = [...container.querySelectorAll('.process-requirement__text')].map(
      (item) => item.textContent,
    );
    expect(texts).toEqual(['Requisito sin descripción', 'Requisito sin descripción']);
    expect(container.querySelector('.process-tag').textContent).toBe('Obligatorio');
  });

  it.each([[[]], [undefined], [null]])('avisa cuando no hay requisitos (%j)', (requirements) => {
    renderAdoptionProcess(container, { ...ADOPTION, requirements });

    expect(container.querySelector('.process-requirements')).toBeNull();
    expect(container.textContent).toContain('Esta adopción no tiene requisitos asociados.');
  });

  it('muestra la fecha del contrato y el enlace para verlo completo', () => {
    renderAdoptionProcess(container, ADOPTION);

    expect(container.querySelector('.process__contract').textContent).toBe(
      'Fecha del contrato: 20 mar 2026',
    );
    expect(container.querySelector('.process__link').getAttribute('href')).toBe(
      'contract.html?adoption=7',
    );
  });

  it('avisa cuando la adopción aún no tiene contrato', () => {
    renderAdoptionProcess(container, { ...ADOPTION, contract: null });

    expect(container.querySelector('.process__link')).toBeNull();
    expect(container.textContent).toContain('Esta adopción aún no tiene contrato.');
  });

  it('muestra textos de reserva cuando faltan datos', () => {
    renderAdoptionProcess(container, { requirements: [] });

    expect(facts()).toEqual([
      ['Fecha de adopción', 'Fecha no disponible'],
      ['Estado', 'Sin estado'],
    ]);
  });

  it('inserta los textos como texto y no como HTML', () => {
    renderAdoptionProcess(container, {
      ...ADOPTION,
      status: '<img src=x onerror=alert(1)>',
      requirements: [{ description: '<script>alert(1)</script>' }],
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('.process-requirement__text').textContent).toBe(
      '<script>alert(1)</script>',
    );
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderAdoptionProcess(container, ADOPTION);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelectorAll('.process')).toHaveLength(1);
  });
});
