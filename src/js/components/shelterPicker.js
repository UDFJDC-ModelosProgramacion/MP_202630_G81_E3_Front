import { field } from '../utils/ui.js';

export function shelterField(shelters = [], selected = '') {
  return field({
    label: 'Refugio',
    name: 'shelter',
    value: selected,
    options: [
      { value: '', label: 'Selecciona un refugio' },
      ...shelters.map((shelter) => ({
        value: shelter.id,
        label: shelter.city ? `${shelter.name} · ${shelter.city}` : shelter.name,
      })),
    ],
  });
}
