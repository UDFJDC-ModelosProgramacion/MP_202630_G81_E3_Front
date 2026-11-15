import * as sheltersApi from '../api/sheltersApi.js';
import { renderHeader } from '../components/header.js';
import { renderShelterDetail } from '../components/shelterDetail.js';
import { createShelterFilter } from '../components/shelterFilter.js';
import { renderShelterList } from '../components/shelterList.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { citiesOf } from '../domain/shelters.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const NOT_FOUND_TITLE = 'Refugio no encontrado';
const LIST_URL = 'shelters.html';

const isValidId = (value) => /^\d+$/.test(String(value));
const goTo = (url) => window.location.assign(url);

function renderNotFound(app, navigate) {
  renderEmpty(app, {
    title: NOT_FOUND_TITLE,
    text: 'Revisa el enlace o vuelve al listado de refugios.',
    actionLabel: 'Ver todos los refugios',
    onAction: () => navigate(LIST_URL),
  });
}

function showList(app, api) {
  let cities = [];
  let city = '';
  const filterMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Refugios'),
    el(
      'p',
      { class: 'page-lead' },
      'Encuentra un refugio cercano para conocer y adoptar una mascota.',
    ),
    filterMount,
    listMount,
  );

  function paintFilter() {
    clear(filterMount).append(createShelterFilter({ cities, city, onFilter: load }));
  }

  async function load(selectedCity = '') {
    city = selectedCity;
    renderLoading(listMount, 'Cargando refugios…');
    try {
      const shelters = await api.listShelters({ city });
      if (!city) cities = citiesOf(shelters);
      renderShelterList(listMount, shelters, { city, onShowAll: () => load('') });
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar los refugios',
        text: friendlyMessage(error),
        onRetry: () => load(city),
      });
    }
    paintFilter();
  }

  return load();
}

function showDetail(app, id, { api, navigate }) {
  async function load() {
    renderLoading(app, 'Cargando refugio…');
    try {
      renderShelterDetail(app, await api.getShelter(id));
    } catch (error) {
      if (error.status === 404) {
        renderNotFound(app, navigate);
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
 * Página de refugios. Sin parámetros muestra el listado con el filtro por ciudad
 * (`shelters.html`); con `?id=<n>` muestra el detalle de ese refugio.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export async function initSheltersPage(
  doc = document,
  { api = sheltersApi, search = window.location.search, navigate = goTo } = {},
) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'shelters' });

  const id = getQueryParam('id', search);
  if (id === null) return showList(app, api);
  if (!isValidId(id)) return renderNotFound(app, navigate);
  return showDetail(app, id, { api, navigate });
}
