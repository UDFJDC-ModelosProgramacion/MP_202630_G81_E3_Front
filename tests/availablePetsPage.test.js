import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { renderAvailablePetsPage } from '../src/js/pages/availablePetsPage.js';
import { until } from './helpers.js';

const PETS = [
  {
    id: 1,
    name: 'Luna',
    age: 2,
    sex: 'FEMALE',
    size: 'SMALL',
    status: 'AVAILABLE',
    activityLevel: 'LOW',
    spaceRequirement: 'SMALL',
    compatibleWithChildren: true,
    compatibleWithOtherPets: false,
  },
  {
    id: 2,
    name: 'Rocky',
    age: 4,
    sex: 'MALE',
    size: 'LARGE',
    status: 'AVAILABLE',
    activityLevel: 'HIGH',
    spaceRequirement: 'MEDIUM',
    compatibleWithChildren: false,
    compatibleWithOtherPets: true,
  },
  {
    id: 3,
    name: 'Kira',
    age: 1,
    sex: 'FEMALE',
    size: 'LARGE',
    status: 'AVAILABLE',
    activityLevel: 'HIGH',
    spaceRequirement: 'MEDIUM',
    compatibleWithChildren: true,
    compatibleWithOtherPets: true,
  },
];

const names = () => [...document.querySelectorAll('.pet-card__name')].map((n) => n.textContent);
const control = (name) => document.querySelector(`[name="${name}"]`);
const choose = (name, value) => {
  const select = control(name);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};
const toggle = (name) => control(name).click();

/** Simula el back: filtra por actividad y espacio con texto exacto. */
const fakeBack = () =>
  vi.fn(async ({ activityLevel, spaceRequirement }) =>
    PETS.filter((p) => !activityLevel || p.activityLevel === activityLevel).filter(
      (p) => !spaceRequirement || p.spaceRequirement === spaceRequirement,
    ),
  );

async function open(fetchAvailable = fakeBack()) {
  document.body.innerHTML = '<div id="app"></div>';
  const done = renderAvailablePetsPage(document.querySelector('#app'), fetchAvailable);
  await done;
  return fetchAvailable;
}

describe('renderAvailablePetsPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('muestra el loader y luego todas las disponibles con sus opciones de filtro', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const pending = renderAvailablePetsPage(document.querySelector('#app'), fakeBack());
    expect(document.querySelector('.state--loading')).not.toBeNull();
    await pending;
    expect(names()).toEqual(['Luna', 'Rocky', 'Kira']);
    expect(document.querySelector('.pets-toolbar__count').textContent).toBe(
      '3 mascotas disponibles',
    );
    expect([...control('activityLevel').options].map((o) => o.value)).toEqual(['', 'HIGH', 'LOW']);
    expect([...control('activityLevel').options].map((o) => o.textContent)).toEqual([
      'Todos',
      'Alto',
      'Bajo',
    ]);
  });

  it('actividad y espacio se piden al back', async () => {
    const fetchAvailable = await open();
    choose('activityLevel', 'HIGH');
    await until(() => names().length === 2);
    expect(fetchAvailable).toHaveBeenLastCalledWith({
      activityLevel: 'HIGH',
      spaceRequirement: '',
      species: '',
      minAge: '',
      maxAge: '',
    });
    choose('spaceRequirement', 'SMALL');
    await until(() => document.querySelector('.state--empty'));
    expect(fetchAvailable).toHaveBeenLastCalledWith({
      activityLevel: 'HIGH',
      spaceRequirement: 'SMALL',
      species: '',
      minAge: '',
      maxAge: '',
    });
  });

  it('tamaño, sexo y compatibilidad filtran sin volver a pedir al back', async () => {
    const fetchAvailable = await open();
    choose('size', 'Tamaño grande');
    expect(names()).toEqual(['Rocky', 'Kira']);
    choose('sex', 'Hembra');
    expect(names()).toEqual(['Kira']);
    choose('sex', '');
    toggle('children');
    expect(names()).toEqual(['Kira']);
    toggle('otherPets');
    expect(names()).toEqual(['Kira']);
    expect(fetchAvailable).toHaveBeenCalledTimes(1);
  });

  it('combina filtros del back y del cliente', async () => {
    await open();
    choose('activityLevel', 'HIGH');
    await until(() => names().length === 2);
    toggle('children');
    expect(names()).toEqual(['Kira']);
  });

  it('sin coincidencias muestra mensaje y permite limpiar los filtros', async () => {
    await open();
    choose('size', 'Tamaño pequeño');
    choose('sex', 'Macho');
    expect(document.querySelector('.state__title').textContent).toBe(
      'No hay mascotas con estos filtros',
    );
    document.querySelector('.state button').click();
    await until(() => names().length === 3);
    expect(control('size').value).toBe('');
  });

  const chips = () =>
    [...document.querySelectorAll('.filter-chips .chip')].map((c) => c.firstChild.textContent);

  it('sin filtros no hay chips; los filtros activos se ven como chips', async () => {
    await open();
    expect(document.querySelector('.filter-chips')).toBeNull();
    choose('size', 'Tamaño pequeño');
    toggle('children');
    expect(chips()).toEqual(['Tamaño: Pequeño', 'Compatible con niños']);
  });

  it('combinar actividad y espacio cumple ambos y se muestran dos chips', async () => {
    await open();
    choose('activityLevel', 'HIGH');
    choose('spaceRequirement', 'MEDIUM');
    await until(() => chips().length === 2);
    expect(chips()).toEqual(['Actividad: Alto', 'Espacio: Medio']);
    expect(names()).toEqual(['Rocky', 'Kira']);
  });

  it('quitar un chip elimina solo ese filtro y actualiza el listado sin recargar', async () => {
    await open();
    choose('size', 'Tamaño pequeño');
    toggle('children');
    document.querySelector('.chip__remove').click();
    expect(chips()).toEqual(['Compatible con niños']);
    expect(control('size').value).toBe('');
    expect(names()).toEqual(['Luna', 'Kira']);
  });

  it('el botón «Limpiar filtros» de los chips restaura todas las disponibles', async () => {
    await open();
    choose('size', 'Tamaño pequeño');
    document.querySelector('.filter-chips-wrap .btn').click();
    await until(() => names().length === 3);
    expect(document.querySelector('.filter-chips')).toBeNull();
  });

  it('solo lista mascotas disponibles aunque el back envíe otras', async () => {
    await open(vi.fn().mockResolvedValue([...PETS.slice(0, 1), { ...PETS[1], status: 'ADOPTED' }]));
    expect(names()).toEqual(['Luna']);
  });

  it('el botón Limpiar filtros restablece todo', async () => {
    await open();
    toggle('children');
    expect(names()).toEqual(['Luna', 'Kira']);
    document.querySelector('.filter-form .btn').click();
    await until(() => names().length === 3);
    expect(control('children').checked).toBe(false);
  });

  it.each([[[]], [null]])('sin mascotas disponibles muestra estado vacío (%j)', async (data) => {
    await open(vi.fn().mockResolvedValue(data));
    expect(document.querySelector('.state__title').textContent).toBe('No hay mascotas disponibles');
    expect(document.querySelector('.state button')).toBeNull();
  });

  it('muestra error y reintenta', async () => {
    const fetchAvailable = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Sin conexión con el servidor', { status: 0 }))
      .mockResolvedValueOnce(PETS);
    await open(fetchAvailable);
    expect(document.querySelector('[role="alert"]').textContent).toContain('Sin conexión');
    document.querySelector('[role="alert"] button').click();
    await until(() => names().length === 3);
  });

  it('descarta respuestas viejas si se filtra de nuevo mientras carga', async () => {
    let releaseFirstFilter;
    const fetchAvailable = vi
      .fn()
      .mockResolvedValueOnce(PETS)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseFirstFilter = () => resolve([PETS[0]]);
          }),
      )
      .mockResolvedValueOnce([PETS[1]]);
    await open(fetchAvailable);
    choose('activityLevel', 'LOW');
    choose('activityLevel', 'HIGH');
    await until(() => names().join() === 'Rocky');
    releaseFirstFilter();
    await new Promise((r) => setTimeout(r, 10));
    expect(names()).toEqual(['Rocky']);
  });

  it('un error tardío de una consulta vieja no pisa la vista', async () => {
    let failFirstFilter;
    const fetchAvailable = vi
      .fn()
      .mockResolvedValueOnce(PETS)
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            failFirstFilter = () => reject(new Error('x'));
          }),
      )
      .mockResolvedValueOnce([PETS[1]]);
    await open(fetchAvailable);
    choose('activityLevel', 'LOW');
    choose('activityLevel', 'HIGH');
    await until(() => names().join() === 'Rocky');
    failFirstFilter();
    await new Promise((r) => setTimeout(r, 10));
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('enviar el formulario no recarga la página', async () => {
    await open();
    const event = new Event('submit', { cancelable: true });
    document.querySelector('.filter-form').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('al hacer clic en una tarjeta abre el detalle', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    await open();
    document.querySelector('.pet-card').click();
    expect(document.querySelector('dialog .pet-dialog__title').textContent).toBe('Luna');
  });
});
