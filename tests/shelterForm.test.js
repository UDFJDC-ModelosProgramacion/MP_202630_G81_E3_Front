import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createShelterForm } from '../src/js/components/shelterForm.js';

let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>';
  container = document.getElementById('box');
});

function buildForm() {
  const onSubmit = vi.fn();
  const form = createShelterForm({ onSubmit });
  container.append(form.element);
  return { form, onSubmit };
}

describe('createShelterForm', () => {
  it('envía los valores escritos y evita la recarga de la página', () => {
    const { form, onSubmit } = buildForm();
    container.querySelector('#shelter-form-name').value = 'Colitas';
    container.querySelector('#shelter-form-city').value = 'Cali';

    const event = new Event('submit', { cancelable: true });
    form.element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Colitas', city: 'Cali' });
  });

  it('marca los campos inválidos, enfoca el primero y limpia al corregir', () => {
    const { form } = buildForm();

    form.showErrors({ city: 'La ciudad es obligatoria.' });

    const city = container.querySelector('#shelter-form-city');
    expect(city.classList.contains('is-invalid')).toBe(true);
    expect(city.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(city);
    expect(container.querySelector('#shelter-form-city-error').textContent).toBe(
      'La ciudad es obligatoria.',
    );

    form.showErrors({});
    expect(container.querySelector('.is-invalid')).toBeNull();
    expect(container.querySelector('#shelter-form-city-error').textContent).toBe('');
  });

  it('reset vacía los campos y los errores', () => {
    const { form } = buildForm();
    const name = container.querySelector('#shelter-form-name');
    name.value = 'Colitas';
    form.showErrors({ city: 'La ciudad es obligatoria.' });

    form.reset();

    expect(name.value).toBe('');
    expect(container.querySelector('.is-invalid')).toBeNull();
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