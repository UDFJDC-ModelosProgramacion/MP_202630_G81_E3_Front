import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showAlert } from '../src/js/components/alert.js';
import { createAdministratorForm } from '../src/js/components/administratorForm.js';
import { renderAdministratorList } from '../src/js/components/administratorList.js';
import { roleLabel } from '../src/js/domain/administratorRoles.js';

let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>';
  container = document.getElementById('box');
});

function submit(form) {
  const event = new Event('submit', { cancelable: true });
  form.dispatchEvent(event);
  return event;
}

describe('roleLabel', () => {
  it('traduce los roles conocidos y conserva los desconocidos', () => {
    expect(roleLabel('DIRECTOR')).toBe('Director');
    expect(roleLabel('COORDINATOR')).toBe('Coordinador');
    expect(roleLabel('OTRO')).toBe('OTRO');
  });
});

describe('showAlert', () => {
  it('usa role alert para errores y status para éxitos', () => {
    showAlert(container, { kind: 'danger', message: 'Falló' });
    expect(container.querySelector('.alert-danger').getAttribute('role')).toBe('alert');

    showAlert(container, { kind: 'success', message: 'Listo' });
    expect(container.querySelector('.alert-success').getAttribute('role')).toBe('status');
    expect(container.querySelectorAll('.alert')).toHaveLength(1);
  });

  it('muestra los detalles como lista', () => {
    showAlert(container, { kind: 'warning', message: 'Parcial', details: ['a', 'b'] });
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('se cierra con el botón', () => {
    showAlert(container, { message: 'Hola' });
    container.querySelector('.btn-close').click();
    expect(container.querySelector('.alert')).toBeNull();
  });
});

describe('createAdministratorForm', () => {
  function buildForm() {
    const onSubmit = vi.fn();
    const form = createAdministratorForm({ onSubmit });
    container.append(form.element);
    return { form, onSubmit };
  }

  it('envía los valores escritos y evita la recarga de la página', () => {
    const { form, onSubmit } = buildForm();
    container.querySelector('#administrator-name').value = 'Marta';
    container.querySelector('#administrator-email').value = 'marta@huellitas.org';
    container.querySelector('#administrator-role').value = 'DIRECTOR';

    const event = submit(form.element);

    expect(event.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Marta',
      email: 'marta@huellitas.org',
      role: 'DIRECTOR',
    });
  });

  it('marca los campos inválidos y limpia los errores al corregirlos', () => {
    const { form } = buildForm();

    form.showErrors({ name: 'El nombre es obligatorio.' });
    const name = container.querySelector('#administrator-name');
    expect(name.classList.contains('is-invalid')).toBe(true);
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('#administrator-name-error').textContent).toBe(
      'El nombre es obligatorio.',
    );

    form.showErrors({});
    expect(name.classList.contains('is-invalid')).toBe(false);
    expect(container.querySelector('#administrator-name-error').textContent).toBe('');
  });

  it('reset vacía los campos y los errores', () => {
    const { form } = buildForm();
    const name = container.querySelector('#administrator-name');
    name.value = 'Marta';
    form.showErrors({ email: 'El correo es obligatorio.' });

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

describe('renderAdministratorList', () => {
  const shelters = [
    { id: 1, name: 'Huellitas', city: 'Bogotá' },
    { id: 2, name: 'Patitas', city: 'Medellín' },
  ];
  const marta = {
    id: 7,
    name: 'Marta Gómez',
    email: 'marta@huellitas.org',
    role: 'DIRECTOR',
    shelters: [shelters[0]],
  };
  const carlos = { id: 8, name: 'Carlos Ruiz', email: 'carlos@patitas.org', role: 'COORDINATOR' };

  function render(overrides = {}) {
    const handlers = { onAssociate: vi.fn(), onDelete: vi.fn() };
    renderAdministratorList(container, {
      administrators: [marta, carlos],
      shelters,
      ...handlers,
      ...overrides,
    });
    return handlers;
  }

  it('muestra un estado vacío cuando no hay administradores', () => {
    render({ administrators: [] });
    expect(container.querySelector('.state--empty')).not.toBeNull();
  });

  it('muestra datos, rol y refugios asociados de cada administrador', () => {
    render();
    const cards = container.querySelectorAll('article.card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Marta Gómez');
    expect(cards[0].textContent).toContain('marta@huellitas.org');
    expect(cards[0].textContent).toContain('Director');
    expect(cards[0].textContent).toContain('Huellitas · Bogotá');
    expect(cards[1].textContent).toContain('Aún no tiene refugios asociados.');
  });

  it('envía los refugios marcados al asociar', () => {
    const { onAssociate } = render();
    container.querySelector('#administrator-7-shelter-2').checked = true;

    submit(container.querySelector('details form'));

    expect(onAssociate).toHaveBeenCalledWith(marta, [2]);
  });

  it('permite enviar sin selección para que la página lo advierta', () => {
    const { onAssociate } = render();
    submit(container.querySelector('details form'));
    expect(onAssociate).toHaveBeenCalledWith(marta, []);
  });

  it('avisa cuando no hay refugios para asociar', () => {
    render({ shelters: [] });
    expect(container.querySelector('details')).toBeNull();
    expect(container.textContent).toContain('No hay refugios para asociar.');
  });

  it('delega la eliminación en el manejador', () => {
    const { onDelete } = render();
    container.querySelector('.btn-outline-danger').click();
    expect(onDelete).toHaveBeenCalledWith(marta);
  });
});
