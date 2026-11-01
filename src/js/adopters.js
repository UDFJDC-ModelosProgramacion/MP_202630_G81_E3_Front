import { deleteAdopter, getAdopter, listAdopters } from './api/adoptersApi.js';
import { renderAdopterList } from './components/adopterList.js';
import { renderAdopterProfile } from './components/adopterProfile.js';
import { renderHeader } from './components/header.js';
import { renderEmpty, renderError, renderLoading } from './components/stateViews.js';
import { clear, el, getQueryParam } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

export const NOT_FOUND_TITLE = 'Adoptante no encontrado';

const goTo = (url) => window.location.assign(url);

function renderNotFound(app, navigate) {
  renderEmpty(app, {
    title: NOT_FOUND_TITLE,
    text: 'Revisa el enlace o vuelve al listado de adoptantes.',
    actionLabel: 'Volver al listado',
    onAction: () => navigate('adopters.html'),
  });
}

async function showList(app) {
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Adoptantes'),
    el('p', { class: 'page-lead' }, 'Selecciona un adoptante para ver su perfil e historial.'),
    listMount,
  );

  async function load() {
    renderLoading(listMount, 'Cargando adoptantes…');
    try {
      renderAdopterList(listMount, await listAdopters());
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar los adoptantes',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

async function showProfile(app, id, navigate) {
  async function load() {
    renderLoading(app, 'Cargando perfil…');
    try {
      const adopter = await getAdopter(id);
      renderAdopterProfile(app, adopter, {
        onDelete: async () => {
          await deleteAdopter(id);
          navigate('adopters.html');
        },
      });
    } catch (error) {
      if (error.status === 404) {
        renderNotFound(app, navigate);
        return;
      }
      renderError(app, {
        title: 'No pudimos cargar el perfil',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

/**
 * Página de adoptantes. Sin parámetros muestra el listado (`adopters.html`);
 * con `?id=<n>` muestra el perfil y el historial de ese adoptante.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export function init(doc = document, search = window.location.search, navigate = goTo) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header);

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const id = getQueryParam('id', search);
  if (id === null) return showList(app);
  if (!/^\d+$/.test(id)) {
    renderNotFound(app, navigate);
    return Promise.resolve();
  }
  return showProfile(app, id, navigate);
}

init();
