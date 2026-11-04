import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPetManagementForm } from '../src/js/components/petManagementForm.js';
import { renderPetManagementList } from '../src/js/components/petManagementList.js';
import { until } from './helpers.js';

const SHELTERS = [{ id: 4, name: 'Huellitas', city: 'Bogotá' }];
const TODAY = () => '2026-11-02';

let mount;
beforeEach(() => {
  document.body.innerHTML = '<div id="mount"></div>';
  mount = document.getElementById('mount');
});

function setup(config = {}) {
  const onSubmit = config.onSubmit ?? vi.fn().mockResolvedValue();
  const form = createPetManagementForm({ shelters: SHELTERS, today: TODAY, onSubmit, ...config });
  mount.append(form.element);
  return { form, onSubmit };
}
const set = (name, value) => {
  document.querySelector(`#pet-${name}`).value = value;
};
function fillValid() {
  set('name', 'Luna');
  set('age', '3');
  set('sex', 'Hembra');
  set('size', 'Tamaño mediano');
  set('shelterId', '4');
  set('arrivalDescription', 'Rescatada');
}
const submit = () =>
  document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

describe('renderPetManagementList', () => {
  it('muestra nombre, estado y la acción editar', () => {
    const onEdit = vi.fn();
    const pet = { id: 1, name: 'Luna', status: 'AVAILABLE', shelter: { name: 'Huellitas' } };
    renderPetManagementList(mount, [pet], { onEdit });
    expect(mount.querySelector('th[scope="row"]').textContent).toBe('Luna');
    expect(mount.querySelector('.badge').textContent).toBe('Disponible');
    mount.querySelector('button').click();
    expect(onEdit).toHaveBeenCalledWith(pet);
  });

  it('resalta la fila en edición y muestra el estado vacío sin mascotas', () => {
    renderPetManagementList(mount, [{ id: 1, name: 'Luna' }], { onEdit: vi.fn(), editingId: 1 });
    expect(mount.querySelector('tr.table-active')).not.toBeNull();
    renderPetManagementList(mount, [], {});
    expect(mount.querySelector('.state__title').textContent).toContain('Aún no hay mascotas');
  });
});

describe('createPetManagementForm', () => {
  it('no registra si faltan campos obligatorios y los señala', () => {
    const { onSubmit } = setup();
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('#pet-name').classList.contains('is-invalid')).toBe(true);
    expect(document.querySelector('#pet-name-error').textContent).toBe('El nombre es obligatorio.');
    expect(document.querySelector('[role="alert"]:not([hidden])').textContent).toContain('falta');
    expect(document.activeElement.id).toBe('pet-name');
  });

  it('con datos válidos envía los valores recortados y limpia el formulario', async () => {
    const { onSubmit } = setup();
    fillValid();
    set('name', '  Luna  ');
    submit();
    await until(
      () => onSubmit.mock.calls.length === 1 && !document.querySelector('button').disabled,
    );
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Luna', shelterId: '4', age: '3' });
    expect(document.querySelector('#pet-name').value).toBe('');
  });

  it('evita duplicados: un segundo envío mientras el primero sigue en curso se ignora', async () => {
    let finish;
    const onSubmit = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const { form } = setup({ onSubmit });
    fillValid();
    submit();
    submit();
    submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(form.isPending()).toBe(true);
    expect(document.querySelector('button[type="submit"]').disabled).toBe(true);
    finish();
    await until(() => !form.isPending());
    expect(document.querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it('un envío repetido tras registrar ya no tiene datos y no crea otro registro', async () => {
    const { onSubmit, form } = setup();
    fillValid();
    submit();
    await until(() => !form.isPending() && onSubmit.mock.calls.length === 1);
    submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('muestra el error del servidor y permite reintentar', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const { form } = setup({ onSubmit });
    fillValid();
    submit();
    await until(() => !form.isPending());
    expect(mount.textContent).toContain('Ocurrió un error inesperado');
    expect(document.querySelector('#pet-name').value).toBe('Luna');
  });

  it('en edición precarga los valores, no pide la llegada y permite cancelar', () => {
    const onCancel = vi.fn();
    setup({
      isNew: false,
      values: { name: 'Rocky', status: 'AVAILABLE', age: 2, sex: 'Macho', shelterId: 4 },
      onCancel,
    });
    expect(document.querySelector('#pet-name').value).toBe('Rocky');
    expect(document.querySelector('#pet-arrivalDate')).toBeNull();
    expect(document.querySelector('button[type="submit"]').textContent).toBe('Guardar cambios');
    mount.querySelector('button[type="button"]').click();
    expect(onCancel).toHaveBeenCalled();
  });
});
