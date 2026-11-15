import { el } from '../utils/dom.js';

/** Nombre y descripción de la raza. */
export function createBreedCard(breed) {
  const name =
    typeof breed.name === 'string' && breed.name.trim() ? breed.name.trim() : 'Raza sin nombre';
  const description =
    typeof breed.description === 'string' && breed.description.trim()
      ? breed.description.trim()
      : 'Esta raza aún no tiene una descripción registrada.';
  return el(
    'article',
    { class: 'breed-card' },
    el('h2', { class: 'breed-card__name' }, name),
    el('p', { class: 'breed-card__text' }, description),
  );
}
