import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderShelterDetail } from '../src/js/components/shelterDetail.js';
import { createShelterFilter } from '../src/js/components/shelterFilter.js';
import { renderShelterList, shelterHref } from '../src/js/components/shelterList.js';
import { renderLoading } from '../src/js/components/stateViews.js';

let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>';
  container = document.getElementById('box');
});

describe('createShelterFilter', () => {
  function buildFilter(overrides = {}) {
    const onFilter = vi.fn();
    const form = createShelterFilter({
      cities: ['Bogotá', 'Medellín'],
      city: '',
      onFilter,
      ...overrides,
    });
    container.append(form);
    return { form, onFilter };
  }

  it('sugiere las ciudades conocidas y conserva la ciudad activa', () => {
    buildFilter({ city: 'Bogotá' });

    const options = [...container.querySelectorAll('datalist option')].map((o) => o.value);
    expect(options).toEqual(['Bogotá', 'Medellín']);
    expect(container.querySelector('#shelter-city').value).toBe('Bogotá');
  });

  it('al enviar filtra por la ciudad escrita, sin espacios sobrantes', () => {
    const { form, onFilter } = buildFilter();
    container.querySelector('#shelter-city').value = '  Medellín ';

    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onFilter).toHaveBeenCalledWith('Medellín');
  });

  it('el botón Ver todos pide el listado completo', () => {
    const { onFilter } = buildFilter({ city: 'Bogotá' });

    container.querySelector('.btn-outline-secondary').click();

    expect(onFilter).toHaveBeenCalledWith('');
  });
});

describe('renderShelterList', () => {
  const shelters = [
    { id: 1, name: 'Huellitas', city: 'Bogotá', pets: [{ id: 1 }, { id: 2 }] },
    { id: 2, name: 'Patitas', city: 'Medellín' },
  ];

  it('pinta una tarjeta con nombre, ciudad y número de mascotas que enlaza al detalle', () => {
    renderShelterList(container, shelters);

    const cards = container.querySelectorAll('.card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('.card-title').textContent).toBe('Huellitas');
    expect(cards[0].textContent).toContain('Bogotá');
    expect(cards[0].querySelector('.badge').textContent).toBe('2 mascotas');
    expect(cards[0].getAttribute('href')).toBe('shelters.html?id=1');
    expect(cards[1].querySelector('.badge').textContent).toBe('0 mascotas');
    expect(shelterHref(5)).toBe('shelters.html?id=5');
  });

  it('sin refugios ni ciudad muestra el estado vacío', () => {
    renderShelterList(container, []);

    expect(container.querySelector('.state__title').textContent).toBe('Aún no hay refugios');
    expect(container.querySelector('button')).toBeNull();
  });

  it('en una ciudad sin refugios avisa y ofrece ver todos', () => {
    const onShowAll = vi.fn();
    renderShelterList(container, [], { city: 'Cali', onShowAll });

    expect(container.querySelector('.state__title').textContent).toBe('No hay refugios en Cali');
    expect(container.textContent).toContain('No hay refugios registrados en esa ciudad.');

    container.querySelector('button').click();
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it('inserta los datos como texto y no como HTML', () => {
    renderShelterList(container, [{ id: 1, name: '<b>x</b>', city: '<i>y</i>' }]);

    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.card-title').textContent).toBe('<b>x</b>');
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderShelterList(container, shelters);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
  });
});

describe('renderShelterDetail', () => {
  const shelter = {
    id: 1,
    name: 'Huellitas',
    city: 'Bogotá',
    pets: [{ id: 1, name: 'Luna', status: 'AVAILABLE' }, { id: 2, name: 'Milo' }],
    veterinarians: [{ id: 1, name: 'Carolina Pérez', speciality: 'Medicina general' }],
    events: [{ id: 1, type: 'ADOPTION_DAY', date: '2026-10-04T15:00:00.000+00:00' }],
  };

  const section = (title) =>
    [...container.querySelectorAll('section')].find(
      (node) => node.querySelector('h2').textContent === title,
    );

  it('muestra nombre, ciudad y ruta de navegación', () => {
    renderShelterDetail(container, shelter);

    expect(container.querySelector('h1').textContent).toBe('Huellitas');
    expect(container.querySelector('.page-lead').textContent).toBe('Bogotá');
    expect(container.querySelector('.breadcrumb a').getAttribute('href')).toBe('shelters.html');
    expect(container.querySelector('[aria-current="page"]').textContent).toBe('Huellitas');
  });

  it('lista las mascotas, los veterinarios y los eventos', () => {
    renderShelterDetail(container, shelter);

    const pets = [...section('Mascotas').querySelectorAll('li')].map((li) => li.textContent);
    expect(pets).toEqual(['LunaAVAILABLE', 'MiloSin estado']);
    expect(section('Mascotas').querySelector('.card-header .badge').textContent).toBe('2');
    expect(section('Veterinarios').textContent).toContain('Carolina Pérez');
    expect(section('Veterinarios').textContent).toContain('Medicina general');
    expect(section('Eventos').textContent).toContain('ADOPTION_DAY');
    expect(section('Eventos').textContent).toContain('4 oct 2026');
  });

  it('avisa cuando una sección no tiene elementos o el back no la envía', () => {
    renderShelterDetail(container, { id: 2, name: 'Patitas', city: 'Medellín' });

    expect(section('Mascotas').textContent).toContain('Este refugio aún no tiene mascotas.');
    expect(section('Veterinarios').textContent).toContain('Este refugio aún no tiene veterinarios.');
    expect(section('Eventos').textContent).toContain('Este refugio aún no tiene eventos.');
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderShelterDetail(container, shelter);

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
  });
});
