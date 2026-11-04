import * as medicalHistoryApi from '../api/medicalHistoryApi.js';
import { renderHeader } from '../components/header.js';
import { createMedicalPetSearch } from '../components/medicalPetSearch.js';
import { renderMedicalRecordList } from '../components/medicalRecordList.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const ACCESS_DENIED_TITLE = 'Acceso denegado';
const PAGE_URL = 'medical-history.html';

const isValidId = (value) => /^\d+$/.test(String(value));
const goTo = (url) => window.location.assign(url);
const searchUrl = (veterinarianId) => `${PAGE_URL}?veterinarian=${encodeURIComponent(veterinarianId)}`;

/** El back responde 403 (o 404, para no revelar que existe) si la mascota no está a su cargo. */
const isDenied = (error) => error.status === 403 || error.status === 404;

function renderDenied(app, navigate, veterinarianId) {
  renderEmpty(app, {
    title: ACCESS_DENIED_TITLE,
    text: 'No tienes autorización para consultar el historial médico de esta mascota.',
    actionLabel: 'Volver a mis mascotas',
    onAction: () => navigate(searchUrl(veterinarianId)),
  });
}

async function loadPetsInCharge(app, veterinarianId, api, retry) {
  renderLoading(app, 'Cargando tus mascotas…');
  try {
    return await api.listPetsInCharge(veterinarianId);
  } catch (error) {
    if (isDenied(error)) return null;
    renderError(app, {
      title: 'No pudimos cargar tus mascotas',
      text: friendlyMessage(error),
      onRetry: retry,
    });
    return undefined;
  }
}

async function showSearch(app, veterinarianId, { api, navigate }) {
  const pets = await loadPetsInCharge(app, veterinarianId, api, () =>
    showSearch(app, veterinarianId, { api, navigate }),
  );
  if (pets === undefined) return;
  if (pets === null) {
    renderDenied(app, navigate, veterinarianId);
    return;
  }
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Historial médico'),
    el(
      'p',
      { class: 'page-lead' },
      'Busca una mascota a tu cargo por nombre o identificador para consultar su historial.',
    ),
    createMedicalPetSearch({ pets, veterinarianId }),
  );
}

async function showHistory(app, veterinarianId, petId, { api, navigate }) {
  const retry = () => showHistory(app, veterinarianId, petId, { api, navigate });
  const pets = await loadPetsInCharge(app, veterinarianId, api, retry);
  if (pets === undefined) return;

  const pet = pets?.find((item) => String(item.id) === petId);
  // La mascota no está a cargo del veterinario: no se consulta el historial.
  if (!pet) {
    renderDenied(app, navigate, veterinarianId);
    return;
  }

  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('a', { class: 'back-link', href: searchUrl(veterinarianId) }, '← Buscar otra mascota'),
    el('h1', { class: 'page-title' }, `Historial médico de ${pet.name}`),
    listMount,
  );

  async function loadRecords() {
    renderLoading(listMount, 'Cargando historial…');
    try {
      renderMedicalRecordList(listMount, await api.listMedicalRecords(veterinarianId, petId));
    } catch (error) {
      if (isDenied(error)) {
        renderDenied(app, navigate, veterinarianId);
        return;
      }
      renderError(listMount, {
        title: 'No pudimos cargar el historial médico',
        text: friendlyMessage(error),
        onRetry: loadRecords,
      });
    }
  }
  await loadRecords();
}

/**
 * Historial médico. `?veterinarian=<n>` muestra el buscador de mascotas a su cargo;
 * `?veterinarian=<n>&pet=<m>` muestra el historial de esa mascota.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export async function initMedicalHistoryPage(
  doc = document,
  { api = medicalHistoryApi, search = window.location.search, navigate = goTo } = {},
) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'medical-history' });

  const veterinarianId = getQueryParam('veterinarian', search);
  if (!isValidId(veterinarianId)) {
    renderEmpty(app, {
      title: 'Falta el veterinario',
      text: 'Abre esta página desde tu perfil de veterinario para consultar historiales.',
    });
    return;
  }

  const petId = getQueryParam('pet', search);
  if (petId === null) return showSearch(app, veterinarianId, { api, navigate });
  if (!isValidId(petId)) return renderDenied(app, navigate, veterinarianId);
  return showHistory(app, veterinarianId, petId, { api, navigate });
}
