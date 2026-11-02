import { el } from '../utils/dom.js';

const INPUT_ID = 'shelter-city';
const DATALIST_ID = 'shelter-cities';

/**
 * Filtro por ciudad (Bootstrap). Sugiere las ciudades conocidas, pero admite cualquier texto
 * para poder consultar ciudades sin refugios.
 *
 * @param {{ cities: string[], city: string, onFilter: (city: string) => void }} options
 *   `onFilter('')` equivale a ver todos los refugios.
 */
export function createShelterFilter({ cities, city, onFilter }) {
  const input = el('input', {
    class: 'form-control',
    id: INPUT_ID,
    name: 'city',
    type: 'text',
    list: DATALIST_ID,
    autocomplete: 'off',
    placeholder: 'Ej. Bogotá',
    value: city,
  });

  return el(
    'form',
    {
      id: 'shelter-filter-form',
      class: 'row g-2 align-items-end mb-4',
      'aria-label': 'Filtrar refugios por ciudad',
      onSubmit: (event) => {
        event.preventDefault();
        onFilter(input.value.trim());
      },
    },
    el(
      'div',
      { class: 'col-sm' },
      el('label', { class: 'form-label', for: INPUT_ID }, 'Ciudad'),
      input,
      el('datalist', { id: DATALIST_ID }, ...cities.map((name) => el('option', { value: name }))),
    ),
    el(
      'div',
      { class: 'col-sm-auto d-flex gap-2' },
      el('button', { class: 'btn btn-primary', type: 'submit' }, 'Filtrar'),
      el(
        'button',
        { class: 'btn btn-outline-secondary', type: 'button', onClick: () => onFilter('') },
        'Ver todos',
      ),
    ),
  );
}
