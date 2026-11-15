import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/js/api/httpClient.js';
import { createEventTimeline } from '../src/js/components/eventTimeline.js';
import { init } from '../src/js/events.js';
import { renderPetEventsPage } from '../src/js/pages/petEventsPage.js';
import { until } from './helpers.js';

const EVENTS = [
  { id: 2, eventType: 'VACCINATION', date: '2026-10-01', description: 'Vacuna triple' },
  { id: 1, eventType: 'ARRIVAL', date: '2026-09-01', description: 'Rescatada <b>x</b>' },
  { id: 3, eventType: 'VACCINATION', date: '2026-11-01', description: 'Refuerzo' },
];
const texts = (selector) => [...document.querySelectorAll(selector)].map((n) => n.textContent);

async function open(deps = {}) {
  document.body.innerHTML = '<div id="app"></div>';
  await renderPetEventsPage(document.getElementById('app'), 7, {
    fetchEvents: vi.fn().mockResolvedValue(EVENTS),
    fetchPet: vi.fn().mockResolvedValue({ name: 'Luna' }),
    ...deps,
  });
}

describe('renderPetEventsPage', () => {
  it('muestra el nombre y los eventos del más antiguo al más reciente', async () => {
    await open();
    expect(document.querySelector('h1').textContent).toBe('Historial de Luna');
    expect(texts('.timeline__text')).toEqual(['Rescatada <b>x</b>', 'Vacuna triple', 'Refuerzo']);
    expect(texts('.timeline__type')).toEqual(['Llegada', 'Vacunación', 'Vacunación']);
    expect(document.querySelector('.timeline__item b')).toBeNull();
    expect(document.querySelector('.pets-toolbar__count').textContent).toBe('3 eventos');
  });

  it('muestra el loader mientras carga', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPetEventsPage(document.getElementById('app'), 7, {
      fetchEvents: () => new Promise(() => {}),
      fetchPet: () => new Promise(() => {}),
    });
    expect(document.querySelector('.state--loading')).not.toBeNull();
  });

  it('filtra por tipo y permite volver a ver todos', async () => {
    await open();
    expect(texts('.event-filter')).toEqual(['Todos', 'Llegada', 'Vacunación']);
    const buttons = [...document.querySelectorAll('.event-filter')];
    buttons[2].click();
    expect(texts('.timeline__text')).toEqual(['Vacuna triple', 'Refuerzo']);
    expect(document.querySelector('.pets-toolbar__count').textContent).toBe('2 eventos');
    expect(document.querySelectorAll('.event-filter')[2].getAttribute('aria-pressed')).toBe('true');
    document.querySelectorAll('.event-filter')[0].click();
    expect(document.querySelectorAll('.timeline__item')).toHaveLength(3);
  });

  it('un solo evento usa el singular', async () => {
    await open({ fetchEvents: vi.fn().mockResolvedValue([EVENTS[1]]) });
    expect(document.querySelector('.pets-toolbar__count').textContent).toBe('1 evento');
  });

  it('sin eventos muestra el estado vacío', async () => {
    await open({ fetchEvents: vi.fn().mockResolvedValue(null) });
    expect(document.querySelector('.state__title').textContent).toBe(
      'Aún no hay eventos registrados',
    );
    expect(document.querySelectorAll('.event-filter')).toHaveLength(0);
  });

  it('usa el título genérico si no se pudo leer la mascota', async () => {
    await open({ fetchPet: vi.fn().mockRejectedValue(new Error('x')) });
    expect(document.querySelector('h1').textContent).toBe('Historial de eventos');
    expect(document.querySelectorAll('.timeline__item')).toHaveLength(3);
  });

  it('404 muestra mascota no encontrada', async () => {
    await open({
      fetchEvents: vi.fn().mockRejectedValue(new ApiError('Pet not found', { status: 404 })),
    });
    expect(document.querySelector('.state__title').textContent).toBe('Mascota no encontrada');
  });

  it('otro error muestra el mensaje y reintenta', async () => {
    const fetchEvents = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Sin conexión', { status: 0 }))
      .mockResolvedValueOnce(EVENTS);
    await open({ fetchEvents });
    expect(document.querySelector('[role="alert"]').textContent).toContain('Sin conexión');
    document.querySelector('[role="alert"] button').click();
    await until(() => document.querySelectorAll('.timeline__item').length === 3);
  });
});

describe('createEventTimeline', () => {
  it('muestra la fecha en una etiqueta time y tolera fechas inválidas', () => {
    const list = createEventTimeline([
      { eventType: 'ARRIVAL', date: '2026-09-01' },
      { eventType: 'SURGERY', date: null, description: '' },
    ]);
    expect(list.querySelector('time').getAttribute('datetime')).toBe('2026-09-01');
    expect(list.querySelectorAll('time')).toHaveLength(1);
    expect(list.textContent).toContain('Fecha no disponible');
  });
});

describe('init (eventos.html)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="site-header"></header><main><div id="app"></div></main>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')));
  });

  it.each(['', '?petId=abc', '?petId='])(
    'sin id válido (%s) avisa que falta la mascota',
    async (search) => {
      await init(document, search);
      expect(document.querySelector('.state__title').textContent).toBe('Falta la mascota');
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('con id válido pide los eventos de esa mascota', async () => {
    await init(document, '?petId=7');
    expect(fetch.mock.calls[0][0]).toBe('/api/pets/7/events');
    expect(document.querySelector('[aria-current="page"]').textContent).toBe('Mascotas');
  });

  it('sin contenedor no falla', async () => {
    document.body.innerHTML = '';
    await expect(init(document, '?petId=7')).resolves.toBeUndefined();
  });
});
