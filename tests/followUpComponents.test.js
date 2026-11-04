import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderFollowUpAdoptionList } from '../src/js/components/followUpAdoptionList.js';
import { renderFollowUpForm } from '../src/js/components/followUpForm.js';
import { renderFollowUpHistory } from '../src/js/components/followUpHistory.js';
import { until } from './helpers.js';

let mount;
beforeEach(() => {
  document.body.innerHTML = '<div id="mount"></div>';
  mount = document.getElementById('mount');
});

function fill({ date = '2026-11-01', status = '', observations = '' } = {}) {
  document.querySelector('#followup-date').value = date;
  document.querySelector('#followup-status').value = status;
  document.querySelector('#followup-observations').value = observations;
}
const submit = () =>
  document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

describe('renderFollowUpAdoptionList', () => {
  it('pinta una tarjeta por adopción con enlace a su seguimiento', () => {
    renderFollowUpAdoptionList(mount, 2, [{ id: 7, pet: { name: 'Luna' }, adoptionDate: '2026-09-20' }]);
    expect(mount.querySelector('.card-title').textContent).toBe('Luna');
    expect(mount.querySelector('a').getAttribute('href')).toBe('follow-ups.html?adopter=2&adoption=7');
  });

  it('sin adopciones muestra el estado vacío', () => {
    renderFollowUpAdoptionList(mount, 2, []);
    expect(mount.querySelector('.state__title').textContent).toContain('Aún no tienes adopciones');
  });
});

describe('renderFollowUpForm', () => {
  it('no guarda si faltan campos y dice cuáles', () => {
    const onSubmit = vi.fn();
    renderFollowUpForm(mount, { onSubmit, today: () => '2026-11-02' });
    fill();
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    const messages = [...mount.querySelectorAll('.field__error')].map((n) => n.textContent);
    expect(messages).toEqual(['', 'Elige el estado de adaptación.', 'Las observaciones son obligatorias.']);
    expect(mount.querySelector('[role="alert"]').textContent).toContain('falta información');
    expect(document.activeElement.id).toBe('followup-status');
  });

  it('con datos válidos guarda con fecha, estado y observaciones recortadas', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderFollowUpForm(mount, { onSubmit, today: () => '2026-11-02' });
    fill({ status: 'GOOD', observations: '  Duerme tranquilo  ' });
    submit();
    await until(() => mount.querySelector('[role="status"]').textContent !== '');
    expect(onSubmit).toHaveBeenCalledWith({
      date: '2026-11-01',
      adaptationStatus: 'GOOD',
      observations: 'Duerme tranquilo',
    });
    expect(mount.querySelector('#followup-observations').value).toBe('');
  });

  it('muestra el error del servidor y reactiva el botón', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    renderFollowUpForm(mount, { onSubmit, today: () => '2026-11-02' });
    fill({ status: 'GOOD', observations: 'Ok' });
    submit();
    await until(() => mount.textContent.includes('Ocurrió un error inesperado'));
    await until(() => !mount.querySelector('button').disabled);
  });
});

describe('renderFollowUpHistory', () => {
  it('ordena del más reciente al más antiguo', () => {
    renderFollowUpHistory(mount, [
      { id: 1, date: '2026-10-01', adaptationStatus: 'ADAPTING', observations: 'Primero' },
      { id: 2, date: '2026-10-15', adaptationStatus: 'GOOD', observations: 'Segundo' },
    ]);
    const texts = [...mount.querySelectorAll('.review-card__comment')].map((n) => n.textContent);
    expect(texts).toEqual(['Segundo', 'Primero']);
    expect(mount.querySelector('.chip').textContent).toBe('Adaptación buena');
  });

  it('inserta los datos como texto y no como HTML', () => {
    renderFollowUpHistory(mount, [{ id: 1, date: 'x', observations: '<b>hola</b>' }]);
    expect(mount.querySelector('b')).toBeNull();
    expect(mount.querySelector('time').textContent).toBe('Fecha no disponible');
  });

  it('sin registros muestra el estado vacío', () => {
    renderFollowUpHistory(mount, []);
    expect(mount.querySelector('.state__title').textContent).toBe('Aún no hay seguimientos');
  });
});
