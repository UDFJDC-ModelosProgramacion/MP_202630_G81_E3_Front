import { getPetBreed } from '../api/petBreedApi.js';
import { getPet } from '../api/petManagementApi.js';
import { createBreedCard } from '../components/breedCard.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const isNotFound = (error) => error?.status === 404;
const backLink = () =>
  el('a', { class: 'btn btn--outline', href: 'pets.html' }, 'Volver a mascotas');

/**
 * Raza de una mascota. La mascota se consulta aparte para distinguir entre
 * "la mascota no existe" y "la mascota no tiene raza".
 */
export async function renderPetBreedPage(
  mount,
  petId,
  { fetchBreed = getPetBreed, fetchPet = getPet } = {},
) {
  const title = el('h1', { class: 'page-title' }, 'Raza de la mascota');
  const results = el('section', { 'aria-label': 'Raza' });

  async function load() {
    renderLoading(results, 'Cargando raza…');
    try {
      const [pet, breed] = await Promise.all([
        fetchPet(petId),
        fetchBreed(petId).catch((error) => {
          if (isNotFound(error)) return null;
          throw error;
        }),
      ]);
      if (pet?.name) title.textContent = `Raza de ${pet.name}`;
      if (!breed) {
        renderEmpty(results, {
          title: 'Esta mascota aún no tiene raza registrada',
          text: 'Cuando el refugio la registre, podrás consultarla aquí.',
        });
        return;
      }
      results.setAttribute('aria-busy', 'false');
      clear(results).append(createBreedCard(breed));
    } catch (error) {
      if (isNotFound(error)) {
        renderEmpty(results, {
          title: 'Mascota no encontrada',
          text: 'Revisa el enlace o vuelve al listado de mascotas.',
        });
        return;
      }
      renderError(results, {
        title: 'No pudimos cargar la raza',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  clear(mount).append(
    el('p', { class: 'eyebrow' }, 'MASCOTA'),
    title,
    el(
      'p',
      { class: 'page-lead' },
      'Conoce sus características generales y si se ajusta a lo que buscas.',
    ),
    el('div', { class: 'pets-toolbar' }, backLink()),
    results,
  );
  return load();
}
