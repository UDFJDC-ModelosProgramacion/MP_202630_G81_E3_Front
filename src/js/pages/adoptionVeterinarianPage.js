import { NAV_LINKS } from '../config.js';
import { getAdoption } from '../api/adoptionsApi.js';
import * as adoptionVeterinarianApi from '../api/adoptionVeterinarianApi.js';
import { listShelterVeterinarians } from '../api/veterinariansApi.js';
import { renderAdoptionVeterinarianPanel } from '../components/adoptionVeterinarianPanel.js';
import { showAlert } from '../components/alert.js';
import { renderHeader } from '../components/header.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { isActiveAdoption } from '../domain/veterinarians.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const defaultApi = { ...adoptionVeterinarianApi, getAdoption, listShelterVeterinarians };
const defaultConfirm = (message) => window.confirm(message);
const isValidId = (value) => /^\d+$/.test(String(value));

export function createAdoptionVeterinarianPage({
  adoptionId,
  api = defaultApi,
  confirmAction = defaultConfirm,
}) {
  const feedback = el('div', { id: 'feedback' });
  const panelMount = el('div', { id: 'adoption-veterinarian-panel', 'aria-live': 'polite' });

  async function load() {
    renderLoading(panelMount, 'Cargando la adopción…');
    try {
      const adoption = await api.getAdoption(adoptionId);
      if (!adoption) {
        renderEmpty(panelMount, {
          title: 'No encontramos la adopción',
          text: 'Verifica el enlace e inténtalo de nuevo.',
        });
        return;
      }
      const shelterId = adoption.pet?.shelter?.id;
      const needsCandidates =
        !adoption.veterinarian && isActiveAdoption(adoption) && shelterId != null;
      const candidates = needsCandidates ? await api.listShelterVeterinarians(shelterId) : [];
      renderAdoptionVeterinarianPanel(panelMount, {
        adoption,
        candidates,
        onAssign: assign,
        onRemove: remove,
      });
    } catch (error) {
      renderError(panelMount, {
        title: 'No pudimos cargar la adopción',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  async function assign(veterinarian) {
    try {
      await api.assignVeterinarian(adoptionId, veterinarian.id);
      showAlert(feedback, {
        kind: 'success',
        message: `${veterinarian.name} ahora acompaña esta adopción.`,
      });
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    }
    await load();
  }

  async function remove() {
    if (!confirmAction('¿Seguro que quieres quitar al veterinario de esta adopción?')) return;
    try {
      await api.removeVeterinarian(adoptionId);
      showAlert(feedback, {
        kind: 'success',
        message: 'Veterinario quitado. Ya está disponible para otras adopciones.',
      });
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    }
    await load();
  }

  const element = el(
    'div',
    {},
    el('h1', { class: 'page-title' }, 'Veterinario de la adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Elige qué veterinario del refugio acompaña esta adopción. Mientras la acompañe, no está disponible.',
    ),
    feedback,
    panelMount,
    el(
      'p',
      { class: 'mt-4' },
      el(
        'a',
        { href: `adoption.html?adoption=${encodeURIComponent(adoptionId)}` },
        '← Volver al proceso de adopción',
      ),
    ),
  );

  return { element, load };
}

export async function initAdoptionVeterinarianPage(doc = document, options = {}) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS });

  const search = options.search ?? window.location.search;
  const adoptionId = getQueryParam('adoption', search);
  if (!isValidId(adoptionId)) {
    renderEmpty(app, {
      title: 'Falta la adopción',
      text: 'Abre esta página desde una adopción para elegir su veterinario.',
    });
    return;
  }

  const page = createAdoptionVeterinarianPage({ ...options, adoptionId });
  clear(app).append(page.element);
  await page.load();
}
