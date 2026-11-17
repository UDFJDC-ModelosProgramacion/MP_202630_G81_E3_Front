import * as sheltersApi from '../api/administratorSheltersApi.js';
import { showAlert } from '../components/alert.js';
import { renderAdministratorShelterList } from '../components/administratorShelterList.js';
import { renderHeader } from '../components/header.js';
import { renderShelterDetail } from '../components/shelterDetail.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const ACCESS_DENIED_TITLE = 'Acceso denegado';
const PAGE_URL = 'administrator-shelters.html';

const defaultApi = {
  listShelters: sheltersApi.listAdministratorShelters,
  getShelter: sheltersApi.getAdministratorShelter,
  unlinkShelter: sheltersApi.unlinkShelter,
};

const isValidId = (value) => /^\d+$/.test(String(value));
const goTo = (url) => window.location.assign(url);
const defaultConfirm = (message) => window.confirm(message);
const listUrl = (administratorId) =>
  `${PAGE_URL}?administrator=${encodeURIComponent(administratorId)}`;

const backToListAction = (navigate, administratorId) => ({
  actionLabel: 'Volver a mis refugios',
  onAction: () => navigate(listUrl(administratorId)),
});

function renderNotFound(app, navigate, administratorId, text) {
  renderEmpty(app, {
    title: 'No encontrado',
    text,
    ...backToListAction(navigate, administratorId),
  });
}

function showList(app, administratorId, { api, confirmAction }) {
  const feedback = el('div', { id: 'feedback' });
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Mis refugios'),
    el(
      'p',
      { class: 'page-lead' },
      'Los refugios que gestionas. Desvincúlate de los que ya no administras.',
    ),
    feedback,
    listMount,
  );

  async function load() {
    renderLoading(listMount, 'Cargando tus refugios…');
    try {
      const shelters = await api.listShelters(administratorId);
      renderAdministratorShelterList(listMount, shelters, { administratorId, onUnlink: unlink });
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar tus refugios',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  async function unlink(shelter) {
    if (!confirmAction(`¿Seguro que quieres desvincularte de ${shelter.name}?`)) return;
    try {
      await api.unlinkShelter(administratorId, shelter.id);
      showAlert(feedback, { kind: 'success', message: `Te desvinculaste de ${shelter.name}.` });
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    }
    await load();
  }

  return load();
}

function showShelter(app, administratorId, shelterId, { api, navigate }) {
  async function load() {
    renderLoading(app, 'Cargando refugio…');
    try {
      const shelter = await api.getShelter(administratorId, shelterId);
      const detailMount = el('div');
      clear(app).append(
        el(
          'a',
          { class: 'btn btn-outline-secondary mb-3', href: listUrl(administratorId) },
          '← Mis refugios',
        ),
        detailMount,
      );
      renderShelterDetail(detailMount, shelter);
    } catch (error) {
      if (error.status === 412) {
        renderEmpty(app, {
          title: ACCESS_DENIED_TITLE,
          text: error.message,
          ...backToListAction(navigate, administratorId),
        });
        return;
      }
      if (error.status === 404) {
        renderNotFound(app, navigate, administratorId, error.message);
        return;
      }
      renderError(app, {
        title: 'No pudimos cargar el refugio',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

/**
 * Refugios del administrador. `?administrator=<n>` muestra "Mis refugios";
 * `?administrator=<n>&shelter=<m>` muestra la información de ese refugio.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export async function initAdministratorSheltersPage(
  doc = document,
  {
    api = defaultApi,
    search = window.location.search,
    navigate = goTo,
    confirmAction = defaultConfirm,
  } = {},
) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS });

  const administratorId = getQueryParam('administrator', search);
  if (!isValidId(administratorId)) {
    renderEmpty(app, {
      title: 'Falta el administrador',
      text: 'Abre esta página desde tu perfil de administrador para ver tus refugios.',
    });
    return;
  }

  const shelterId = getQueryParam('shelter', search);
  if (shelterId === null) return showList(app, administratorId, { api, confirmAction });
  if (!isValidId(shelterId)) {
    renderNotFound(app, navigate, administratorId, 'Revisa el enlace del refugio.');
    return;
  }
  return showShelter(app, administratorId, shelterId, { api, navigate });
}
