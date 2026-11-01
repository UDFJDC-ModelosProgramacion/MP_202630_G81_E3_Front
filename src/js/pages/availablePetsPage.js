import { getAvailablePets } from '../api/petsApi.js';
import { createPetFilterForm } from '../components/petFilterForm.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import {
  applyClientFilters,
  distinctValues,
  EMPTY_FILTERS,
  hasActiveFilters,
  serverFilters,
} from '../domain/petFilters.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { makePetCard, normalizePet, openPetDetail } from './petsPage.js';

/** Página de mascotas disponibles con filtros (actividad, espacio, tamaño, sexo y compatibilidad). */
export function renderAvailablePetsPage(mount, fetchAvailable = getAvailablePets) {
  let filters = { ...EMPTY_FILTERS };
  let choices = { activityLevel: [], spaceRequirement: [] };
  let requestId = 0;

  const count = el('p', { class: 'pets-toolbar__count', 'aria-live': 'polite' });
  const formMount = el('div', { class: 'filter-panel' });
  const results = el('section', { class: 'pets-grid-wrap', 'aria-label': 'Mascotas disponibles' });

  function paintForm() {
    clear(formMount).append(
      createPetFilterForm({ choices, filters, onChange: setFilter, onReset: reset }),
    );
  }

  function setFilter(name, value) {
    const needsServer = name === 'activityLevel' || name === 'spaceRequirement';
    filters = { ...filters, [name]: value };
    if (needsServer) load();
    else paintResults(lastPets);
  }

  function reset() {
    filters = { ...EMPTY_FILTERS };
    paintForm();
    load();
  }

  let lastPets = [];

  function paintResults(pets) {
    const visible = applyClientFilters(pets, filters);
    count.textContent = `${visible.length} ${visible.length === 1 ? 'mascota disponible' : 'mascotas disponibles'}`;
    results.classList.toggle('pets-grid', visible.length > 0);
    if (visible.length === 0) {
      const filtered = hasActiveFilters(filters);
      renderEmpty(results, {
        title: filtered
          ? 'Ninguna mascota coincide con tu búsqueda'
          : 'No hay mascotas disponibles',
        text: filtered
          ? 'Prueba con otros filtros o límpialos para ver todas las disponibles.'
          : 'Por ahora no hay mascotas disponibles para adopción.',
        actionLabel: filtered ? 'Limpiar filtros' : undefined,
        onAction: filtered ? reset : undefined,
      });
      return;
    }
    results.setAttribute('aria-busy', 'false');
    clear(results).append(...visible.map((pet) => makePetCard(pet, openPetDetail)));
  }

  async function load(isFirst = false) {
    const current = ++requestId;
    results.classList.remove('pets-grid');
    renderLoading(results, 'Buscando mascotas…');
    try {
      const payload = await fetchAvailable(serverFilters(filters));
      if (current !== requestId) return;
      lastPets = (Array.isArray(payload) ? payload : []).map(normalizePet);
      if (isFirst) {
        choices = {
          activityLevel: distinctValues(lastPets, 'activityLevel'),
          spaceRequirement: distinctValues(lastPets, 'spaceRequirement'),
        };
        paintForm();
      }
      paintResults(lastPets);
    } catch (error) {
      if (current !== requestId) return;
      count.textContent = 'No se pudo obtener el listado';
      renderError(results, {
        title: 'No pudimos cargar las mascotas',
        text: friendlyMessage(error),
        onRetry: () => load(isFirst),
      });
    }
  }

  clear(mount).append(
    el(
      'section',
      { class: 'pets-hero' },
      el(
        'div',
        { class: 'pets-hero__copy' },
        el('p', { class: 'eyebrow' }, 'ADOPTA'),
        el('h1', { class: 'page-title' }, 'Encuentra la mascota que se ajusta a ti'),
        el(
          'p',
          { class: 'page-lead' },
          'Filtra las mascotas disponibles según tu espacio, tu ritmo de vida y tu familia.',
        ),
      ),
    ),
    formMount,
    el('div', { class: 'pets-toolbar' }, count),
    results,
  );
  return load(true);
}
