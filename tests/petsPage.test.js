import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from '../src/js/api/httpClient.js';
import { renderPetsPage } from '../src/js/pages/petsPage.js';
import { until } from './helpers.js';

vi.mock('../src/js/api/httpClient.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const PLACEHOLDER = 'assets/images/pet-placeholder.svg';
const LOADING = 'Cargando mascotas…';

const LUNA = { id: 1, name: 'Luna', age: 3, sex: 'F', size: 'small', status: 'AVAILABLE' };
const ROCKY = { id: 2, name: 'Rocky', age: 1, sex: 'male', size: 'large', status: 'adoptada' };
const REX = {
  id: 3,
  name: 'Rex',
  age: 4,
  sex: 'M',
  size: 'L',
  status: 'EN_PROCESO',
  breed: 'Criollo',
  description: 'Muy juguetón',
  photo: 'https://img.test/rex.jpg',
};

const countText = () => document.querySelector('.pets-toolbar__count').textContent;
const cards = () => [...document.querySelectorAll('.pet-card')];
const filterButton = () => document.querySelector('.pets-filter');
const chips = (card) => [...card.querySelectorAll('.chip')].map((chip) => chip.textContent);

async function openPage(payload) {
  request.mockResolvedValue(payload);
  renderPetsPage(document.querySelector('#app'));
  await until(() => countText() !== LOADING);
}

async function openWithPet(pet) {
  await openPage([pet]);
  return cards()[0];
}

describe('página de mascotas', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    request.mockReset();
    // jsdom no implementa <dialog>.showModal() ni close(), así que se simulan.
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  describe('carga del listado', () => {
    it('pide las mascotas y pinta el encabezado y las tarjetas', async () => {
      await openPage([LUNA, ROCKY]);

      expect(request).toHaveBeenCalledWith('/pets');
      expect(document.querySelector('h1.page-title').textContent).toBe(
        'Conoce a las mascotas del refugio',
      );
      expect(countText()).toBe('2 mascotas registradas');
      expect(cards()).toHaveLength(2);
      expect(cards()[0].querySelector('.pet-card__name').textContent).toBe('Luna');
      expect(cards()[0].getAttribute('aria-label')).toBe('Ver detalles de Luna');
    });

    it('usa el singular cuando hay una sola mascota', async () => {
      await openPage([LUNA]);

      expect(countText()).toBe('1 mascota registrada');
    });

    it('muestra el estado de carga mientras espera la respuesta', async () => {
      let resolve;
      request.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        }),
      );

      renderPetsPage(document.querySelector('#app'));

      expect(countText()).toBe(LOADING);
      resolve([LUNA]);
      await until(() => countText() === '1 mascota registrada');
    });

    it.each([
      ['un arreglo directo', [LUNA]],
      ['la clave content', { content: [LUNA] }],
      ['la clave data', { data: [LUNA] }],
      ['la clave mascotas', { mascotas: [LUNA] }],
    ])('lee el listado desde %s', async (_label, payload) => {
      await openPage(payload);

      expect(cards()).toHaveLength(1);
    });

    it.each([
      ['un objeto sin listado', {}],
      ['una respuesta nula', null],
      ['un arreglo vacío', []],
    ])('muestra el estado vacío con %s', async (_label, payload) => {
      await openPage(payload);

      expect(cards()).toHaveLength(0);
      expect(document.querySelector('#pets-grid').textContent).toContain(
        'Aún no hay mascotas registradas',
      );
      expect(document.querySelector('#pets-grid').classList.contains('pets-grid')).toBe(false);
    });

    it('muestra el error y permite reintentar', async () => {
      request
        .mockRejectedValueOnce(new ApiError('sin red', { status: 0 }))
        .mockResolvedValue([LUNA]);

      renderPetsPage(document.querySelector('#app'));
      await until(() => countText() === 'No se pudo obtener el listado');

      const alert = document.querySelector('[role="alert"].state--error');
      expect(alert.textContent).toContain('No pudimos cargar las mascotas');

      document.querySelector('.state--error button').click();

      await until(() => cards().length === 1);
      expect(request).toHaveBeenCalledTimes(2);
    });
  });

  describe('normalización de datos', () => {
    it('usa nombre genérico si la mascota no trae nombre', async () => {
      const card = await openWithPet({ id: 1 });

      expect(card.querySelector('.pet-card__name').textContent).toBe('Mascota sin nombre');
    });

    it('acepta los nombres de campo alternativos del back', async () => {
      const card = await openWithPet({
        nombre: 'Mía',
        edad: 2,
        genero: 'hembra',
        talla: 'mediano',
        estado: 'disponible',
      });

      expect(card.querySelector('.pet-card__name').textContent).toBe('Mía');
      expect(chips(card)).toEqual(['2 años', 'Hembra', 'Tamaño mediano']);
      expect(card.querySelector('.pet-status').textContent).toBe('Disponible');
    });

    it.each([
      [3, '3 años'],
      [1, '1 año'],
      ['1', '1 año'],
      ['4', '4 años'],
      ['2.5', '2.5 años'],
      ['3 meses', '3 meses'],
      ['   ', 'Edad no disponible'],
      [undefined, 'Edad no disponible'],
    ])('formatea la edad %s como "%s"', async (age, expected) => {
      const card = await openWithPet({ name: 'Luna', age });

      expect(chips(card)[0]).toBe(expected);
    });

    describe('edad calculada desde la fecha de nacimiento', () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it.each([
        ['2020-01-10T12:00:00', '6 años'],
        ['2024-06-10T12:00:00', '2 años'],
        ['2024-06-20T12:00:00', '1 año'],
        ['2025-01-10T12:00:00', '1 año'],
        ['2030-01-01T12:00:00', 'Edad no disponible'],
        ['no-es-una-fecha', 'Edad no disponible'],
      ])('calcula la edad de quien nació el %s', async (birthDate, expected) => {
        const card = await openWithPet({ name: 'Luna', birthDate });

        expect(chips(card)[0]).toBe(expected);
      });
    });

    it.each([
      ['M', 'Macho'],
      ['male', 'Macho'],
      ['Hembra', 'Hembra'],
      ['woman', 'Hembra'],
      ['Desconocido', 'Desconocido'],
      [undefined, 'Sexo no disponible'],
    ])('formatea el sexo %s como "%s"', async (sex, expected) => {
      const card = await openWithPet({ name: 'Luna', sex });

      expect(chips(card)[1]).toBe(expected);
    });

    it.each([
      ['small', 'Tamaño pequeño'],
      ['Pequeño', 'Tamaño pequeño'],
      ['M', 'Tamaño mediano'],
      ['mediano', 'Tamaño mediano'],
      ['LARGE', 'Tamaño grande'],
      ['extra_grande', 'Tamaño grande'],
      ['Gigante', 'Tamaño gigante'],
      ['Tamaño enorme', 'Tamaño enorme'],
      [undefined, 'Tamaño no disponible'],
    ])('formatea el tamaño %s como "%s"', async (size, expected) => {
      const card = await openWithPet({ name: 'Luna', size });

      expect(chips(card)[2]).toBe(expected);
    });

    it.each([
      ['AVAILABLE', 'Disponible', 'available'],
      ['disponible', 'Disponible', 'available'],
      ['EN_PROCESO', 'En proceso', 'process'],
      ['pending', 'En proceso', 'process'],
      ['adopted', 'Adoptada', 'adopted'],
      ['Perdida', 'Perdida', 'unknown'],
      [undefined, 'Estado no disponible', 'unknown'],
    ])('interpreta el estado %s como "%s"', async (status, label, kind) => {
      const card = await openWithPet({ name: 'Luna', status });

      const badge = card.querySelector('.pet-status');
      expect(badge.textContent).toBe(label);
      expect(badge.classList.contains(`pet-status--${kind}`)).toBe(true);
      const visual = card.querySelector('.pet-card__visual');
      expect(visual.classList.contains(`pet-card__visual--${kind}`)).toBe(true);
    });

    it.each([
      [{ photo: ' https://img.test/a.jpg ' }, 'https://img.test/a.jpg'],
      [{ photos: ['https://img.test/b.jpg'] }, 'https://img.test/b.jpg'],
      [{ fotos: [{ url: 'https://img.test/c.jpg' }] }, 'https://img.test/c.jpg'],
      [{ photos: [] }, PLACEHOLDER],
      [{ photo: '   ' }, PLACEHOLDER],
      [{ photo: 42 }, PLACEHOLDER],
      [{}, PLACEHOLDER],
    ])('elige la foto para %j', async (fields, expected) => {
      const card = await openWithPet({ name: 'Luna', ...fields });

      const image = card.querySelector('img');
      expect(image.getAttribute('src')).toBe(expected);
      expect(image.getAttribute('alt')).toBe('Foto de Luna');
    });

    it('cambia a la imagen de reemplazo si la foto no carga', async () => {
      const card = await openWithPet({ name: 'Luna', photo: 'https://img.test/rota.jpg' });
      const image = card.querySelector('img');

      image.dispatchEvent(new Event('error'));
      expect(image.getAttribute('src')).toBe(PLACEHOLDER);

      image.dispatchEvent(new Event('error'));
      expect(image.getAttribute('src')).toBe(PLACEHOLDER);
    });
  });

  describe('filtro de disponibles', () => {
    it('muestra solo las disponibles y permite volver a ver todas', async () => {
      await openPage([LUNA, ROCKY]);

      filterButton().click();

      expect(cards()).toHaveLength(1);
      expect(cards()[0].textContent).toContain('Luna');
      expect(filterButton().getAttribute('aria-pressed')).toBe('true');
      expect(filterButton().textContent).toBe('Mostrar todas');
      expect(countText()).toBe('2 mascotas registradas');

      filterButton().click();

      expect(cards()).toHaveLength(2);
      expect(filterButton().getAttribute('aria-pressed')).toBe('false');
      expect(filterButton().textContent).toBe('Filtrar disponibles');
    });

    it('ofrece volver al listado completo si ninguna está disponible', async () => {
      await openPage([ROCKY]);

      filterButton().click();

      const grid = document.querySelector('#pets-grid');
      expect(cards()).toHaveLength(0);
      expect(grid.textContent).toContain('No hay mascotas disponibles');
      const action = [...grid.querySelectorAll('button')].find(
        (button) => button.textContent === 'Mostrar todas',
      );

      action.click();

      expect(cards()).toHaveLength(1);
      expect(filterButton().getAttribute('aria-pressed')).toBe('false');
      expect(filterButton().textContent).toBe('Filtrar disponibles');
    });
  });

  describe('detalle de la mascota', () => {
    it('abre un diálogo con los datos completos', async () => {
      await openPage([REX]);

      cards()[0].click();

      const dialog = document.querySelector('dialog.pet-dialog');
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
      expect(dialog.querySelector('#pet-dialog-title').textContent).toBe('Rex');
      expect(dialog.querySelector('.pet-dialog__breed').textContent).toBe('Criollo');
      expect(dialog.querySelector('.pet-dialog__description').textContent).toBe('Muy juguetón');
      expect(dialog.querySelector('img').getAttribute('src')).toBe('https://img.test/rex.jpg');
      const facts = [...dialog.querySelectorAll('dd')].map((dd) => dd.textContent);
      expect(facts).toEqual(['4 años', 'Macho', 'Tamaño grande', 'En proceso']);
    });

    it('omite raza y descripción cuando no existen', async () => {
      await openPage([LUNA]);

      cards()[0].click();

      const dialog = document.querySelector('dialog.pet-dialog');
      expect(dialog.querySelector('.pet-dialog__breed')).toBeNull();
      expect(dialog.querySelector('.pet-dialog__description')).toBeNull();
    });

    it('se cierra y se elimina con el botón de cerrar', async () => {
      await openPage([REX]);
      cards()[0].click();

      document.querySelector('.pet-dialog__close').click();

      expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
      expect(document.querySelector('dialog')).toBeNull();
    });

    it('se cierra al hacer clic fuera del contenido, pero no dentro', async () => {
      await openPage([REX]);
      cards()[0].click();
      const dialog = document.querySelector('dialog.pet-dialog');

      dialog.querySelector('.pet-dialog__body').click();
      expect(document.querySelector('dialog')).not.toBeNull();

      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('dialog')).toBeNull();
    });

    it('cambia a la imagen de reemplazo si la foto del detalle no carga', async () => {
      await openPage([REX]);
      cards()[0].click();
      const image = document.querySelector('dialog img');

      image.dispatchEvent(new Event('error'));
      expect(image.getAttribute('src')).toBe(PLACEHOLDER);

      image.dispatchEvent(new Event('error'));
      expect(image.getAttribute('src')).toBe(PLACEHOLDER);
    });
  });
});
