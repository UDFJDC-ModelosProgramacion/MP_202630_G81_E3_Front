import * as followUpsApi from '../api/followUpsApi.js';
import { getAdopter } from '../api/adoptersApi.js';
import { renderHeader } from '../components/header.js';
import { renderFollowUpAdoptionList } from '../components/followUpAdoptionList.js';
import { renderFollowUpForm } from '../components/followUpForm.js';
import { renderFollowUpHistory } from '../components/followUpHistory.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { followableAdoptions, petNameOf } from '../domain/followUps.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const ACCESS_DENIED_TITLE = 'Acceso denegado';
const LIST_URL = 'follow-ups.html';

const isValidId = (value) => /^\d+$/.test(String(value));
const goTo = (url) => window.location.assign(url);
const listUrl = (adopterId) => `${LIST_URL}?adopter=${encodeURIComponent(adopterId)}`;

/** El back responde 403 (o 404, para no revelar que existe) si la adopción no es del usuario. */
const isDenied = (error) => error.status === 403 || error.status === 404;

function renderDenied(app, navigate, adopterId) {
  renderEmpty(app, {
    title: ACCESS_DENIED_TITLE,
    text: 'Esta adopción no te pertenece, por eso no puedes ver su seguimiento.',
    actionLabel: 'Volver a mis adopciones',
    onAction: () => navigate(listUrl(adopterId)),
  });
}

function showAdoptions(app, adopterId, api) {
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Seguimiento de adaptación'),
    el(
      'p',
      { class: 'page-lead' },
      'Elige la mascota que adoptaste para registrar y consultar su evolución.',
    ),
  );
  const mount = el('div', { 'aria-live': 'polite' });
  app.append(mount);

  async function load() {
    renderLoading(mount, 'Cargando tus adopciones…');
    try {
      const adopter = await api.getAdopter(adopterId);
      renderFollowUpAdoptionList(mount, adopterId, followableAdoptions(adopter.adoptions));
    } catch (error) {
      renderError(mount, {
        title: 'No pudimos cargar tus adopciones',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }
  return load();
}

async function showFollowUps(app, adopterId, adoptionId, { api, navigate }) {
  renderLoading(app, 'Cargando seguimiento…');

  let adoption;
  try {
    const adopter = await api.getAdopter(adopterId);
    adoption = (adopter.adoptions ?? []).find((item) => String(item.id) === adoptionId);
  } catch (error) {
    renderError(app, {
      title: 'No pudimos cargar tu adopción',
      text: friendlyMessage(error),
      onRetry: () => showFollowUps(app, adopterId, adoptionId, { api, navigate }),
    });
    return;
  }
  // La adopción no está entre las del usuario: no se consulta el seguimiento.
  if (!adoption) {
    renderDenied(app, navigate, adopterId);
    return;
  }

  const formMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('a', { class: 'back-link', href: listUrl(adopterId) }, '← Mis adopciones'),
    el('h1', { class: 'page-title' }, `Seguimiento de ${petNameOf(adoption)}`),
    el('p', { class: 'page-lead' }, 'Registra cómo va su adaptación y revisa su evolución.'),
    el('div', { class: 'reviews-layout' }, formMount, listMount),
  );

  async function loadHistory() {
    renderLoading(listMount, 'Cargando historial…');
    try {
      renderFollowUpHistory(listMount, await api.listFollowUps(adoptionId, adopterId));
    } catch (error) {
      if (isDenied(error)) {
        renderDenied(app, navigate, adopterId);
        return;
      }
      renderError(listMount, {
        title: 'No pudimos cargar el historial',
        text: friendlyMessage(error),
        onRetry: loadHistory,
      });
    }
  }

  renderFollowUpForm(formMount, {
    onSubmit: async (followUp) => {
      await api.createFollowUp(adoptionId, adopterId, followUp);
      await loadHistory();
    },
  });
  await loadHistory();
}

/**
 * Página de seguimiento. `?adopter=<n>` lista las adopciones con seguimiento posible;
 * `?adopter=<n>&adoption=<m>` muestra el formulario y el historial de esa adopción.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export async function initFollowUpsPage(
  doc = document,
  { api = { ...followUpsApi, getAdopter }, search = window.location.search, navigate = goTo } = {},
) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'follow-ups' });

  const adopterId = getQueryParam('adopter', search);
  if (!isValidId(adopterId)) {
    renderEmpty(app, {
      title: 'Falta el adoptante',
      text: 'Abre esta página desde tu perfil de adoptante para ver tus adopciones.',
    });
    return;
  }

  const adoptionId = getQueryParam('adoption', search);
  if (adoptionId === null) return showAdoptions(app, adopterId, api);
  if (!isValidId(adoptionId)) return renderDenied(app, navigate, adopterId);
  return showFollowUps(app, adopterId, adoptionId, { api, navigate });
}
