import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import {
  HAS_ADOPTIONS_MESSAGE,
  NO_ADOPTIONS_MESSAGE,
  formatDate,
  renderAdopterProfile,
} from '../src/js/components/adopterProfile.js';
import { until } from './helpers.js';

describe('formatDate', () => {
  it.each([
    ['2026-09-20', '20/09/2026'],
    ['2026-09-20T10:15:00', '20/09/2026'],
    ['fecha rara', 'fecha rara'],
    [null, 'Sin fecha'],
    [undefined, 'Sin fecha'],
  ])('%s → %s', (value, expected) => {
    expect(formatDate(value)).toBe(expected);
  });
});

describe('renderAdopterProfile', () => {
  let container;
  let onDelete;

  const feedback = () => container.querySelector('.form-feedback').textContent;
  const deleteButton = () => container.querySelector('.btn--danger');

  function render(adopter) {
    renderAdopterProfile(container, adopter, { onDelete });
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
    onDelete = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra nombre, teléfono y la lista de adopciones con fecha y estado', () => {
    render({
      id: 1,
      name: 'Ana Pérez',
      phone: '3001234567',
      adoptions: [
        { id: 10, adoptionDate: '2026-09-20', status: 'APROBADA' },
        { id: 11, adoptionDate: null, status: null },
      ],
    });

    expect(container.querySelector('h1').textContent).toBe('Ana Pérez');
    expect(container.querySelector('.adopter-profile__phone').textContent).toBe('3001234567');
    const items = container.querySelectorAll('.adoption-item');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.adoption-item__date').textContent).toBe('20/09/2026');
    expect(items[0].querySelector('.chip').textContent).toBe('APROBADA');
    expect(items[1].querySelector('.adoption-item__date').textContent).toBe('Sin fecha');
    expect(items[1].querySelector('.chip').textContent).toBe('Sin estado');
    expect(container.querySelector('.back-link').getAttribute('href')).toBe('adopters.html');
  });

  it('sin adopciones muestra el mensaje indicado', () => {
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    expect(container.querySelector('.adoption-list')).toBeNull();
    expect(container.querySelector('.state--empty').textContent).toBe(NO_ADOPTIONS_MESSAGE);
    expect(NO_ADOPTIONS_MESSAGE).toBe('Este adoptante aún no tiene adopciones');
  });

  it('tolera que el back no envíe las adopciones ni el teléfono', () => {
    render({ id: 1, name: 'Ana' });

    expect(container.querySelector('.state--empty').textContent).toBe(NO_ADOPTIONS_MESSAGE);
    expect(container.querySelector('.adopter-profile__phone').textContent).toBe('Sin teléfono');
  });

  it('con adopciones no permite eliminar, informa el motivo y no llama al back', async () => {
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [{ id: 10, status: 'APROBADA' }] });

    deleteButton().click();

    expect(feedback()).toBe(HAS_ADOPTIONS_MESSAGE);
    expect(confirm).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('sin adopciones elimina tras confirmar', async () => {
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    deleteButton().click();

    await until(() => onDelete.mock.calls.length === 1);
    expect(confirm).toHaveBeenCalledWith('¿Eliminar a Ana?');
    expect(feedback()).toBe('');
  });

  it('si el usuario cancela la confirmación no elimina', () => {
    confirm.mockReturnValue(false);
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    deleteButton().click();

    expect(onDelete).not.toHaveBeenCalled();
    expect(deleteButton().disabled).toBe(false);
  });

  it.each([400, 412])('si el back rechaza con %i informa el motivo', async (status) => {
    onDelete.mockRejectedValue(new ApiError('Unable to delete', { status }));
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    deleteButton().click();

    await until(() => feedback() !== '');
    expect(feedback()).toBe(HAS_ADOPTIONS_MESSAGE);
    expect(deleteButton().disabled).toBe(false);
  });

  it('ante otros errores usa el mensaje amigable', async () => {
    onDelete.mockRejectedValue(new Error('boom'));
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    deleteButton().click();

    await until(() => feedback() !== '');
    expect(feedback()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });

  it('bloquea el botón mientras se elimina', async () => {
    let finish;
    onDelete.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render({ id: 1, name: 'Ana', phone: '1', adoptions: [] });

    deleteButton().click();

    expect(deleteButton().disabled).toBe(true);
    finish();
  });
});
