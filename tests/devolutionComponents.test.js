import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAdoptionSummary } from '../src/js/components/adoptionSummary.js';
import { createDevolutionForm } from '../src/js/components/devolutionForm.js';
import { renderDevolution } from '../src/js/components/devolutionView.js';
import { renderLoading } from '../src/js/components/stateViews.js';

let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>';
  container = document.getElementById('box');
});

describe('createDevolutionForm', () => {
  function buildForm() {
    const onSubmit = vi.fn();
    const form = createDevolutionForm({ onSubmit });
    container.append(form.element);
    return { form, onSubmit };
  }

  it('envía los valores escritos y evita la recarga de la página', () => {
    const { form, onSubmit } = buildForm();
    container.querySelector('#devolution-date').value = '2026-09-15';
    container.querySelector('#devolution-reason').value = 'Cambio de ciudad';

    const event = new Event('submit', { cancelable: true });
    form.element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-09-15', reason: 'Cambio de ciudad' });
  });

  it('marca los campos inválidos, enfoca el primero y limpia al corregir', () => {
    const { form } = buildForm();

    form.showErrors({ reason: 'El motivo de la devolución es obligatorio.' });

    const reason = container.querySelector('#devolution-reason');
    expect(reason.classList.contains('is-invalid')).toBe(true);
    expect(reason.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(reason);
    expect(container.querySelector('#devolution-reason-error').textContent).toBe(
      'El motivo de la devolución es obligatorio.',
    );

    form.showErrors({});
    expect(container.querySelector('.is-invalid')).toBeNull();
    expect(container.querySelector('#devolution-reason-error').textContent).toBe('');
  });

  it('deshabilita el botón mientras registra', () => {
    const { form } = buildForm();
    const button = container.querySelector('button[type="submit"]');

    form.setBusy(true);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Registrando…');

    form.setBusy(false);
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Registrar');
  });
});

describe('renderDevolution', () => {
  it('muestra la fecha y el motivo de la devolución', () => {
    renderDevolution(container, { id: 1, date: '2026-09-15', reason: 'Cambio de ciudad' });

    expect(container.querySelector('time').textContent).toBe('15 de septiembre de 2026');
    expect(container.querySelector('time').getAttribute('datetime')).toBe('2026-09-15');
    expect(container.textContent).toContain('Cambio de ciudad');
  });

  it('avisa cuando la fecha no está disponible, sin etiqueta time', () => {
    renderDevolution(container, { id: 1, date: null, reason: 'x' });

    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).toContain('Fecha no disponible');
  });

  it('inserta el motivo como texto y no como HTML', () => {
    renderDevolution(container, { id: 1, date: '2026-09-15', reason: '<img src=x onerror=alert(1)>' });

    expect(container.querySelector('img')).toBeNull();
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderDevolution(container, { id: 1, date: '2026-09-15', reason: 'x' });

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
  });
});

describe('renderAdoptionSummary', () => {
  it('muestra la fecha y el estado de la adopción', () => {
    renderAdoptionSummary(container, { id: 7, adoptionDate: '2026-09-01', status: 'COMPLETED' });

    expect(container.querySelector('time').textContent).toBe('1 de septiembre de 2026');
    expect(container.querySelector('.badge').textContent).toBe('COMPLETED');
  });

  it('indica cuando la adopción no tiene estado', () => {
    renderAdoptionSummary(container, { id: 7, adoptionDate: '2026-09-01' });

    expect(container.querySelector('.badge').textContent).toBe('Sin estado');
  });
});
