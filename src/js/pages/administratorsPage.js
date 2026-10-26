import { NAV_LINKS } from '../config.js';
import * as administratorsApi from '../api/administratorsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { showAlert } from '../components/alert.js';
import { createAdministratorForm } from '../components/administratorForm.js';
import { renderAdministratorList } from '../components/administratorList.js';
import { renderHeader } from '../components/header.js';
import { renderError, renderLoading } from '../components/stateViews.js';
import { associateShelters, summarizeAssociation } from '../services/administratorService.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { validateAdministrator } from '../utils/validation.js';

const defaultApi = { ...administratorsApi, listShelters };
const defaultConfirm = (message) => window.confirm(message);

function normalize({ name, email, role }) {
  return { name: name.trim(), email: email.trim(), role };
}

function buildLayout({ feedback, form, listMount }) {
  return el(
    'div',
    {},
    el('h1', { class: 'page-title' }, 'Administradores'),
    el(
      'p',
      { class: 'page-lead' },
      'Regístrate como administrador y asóciate a los refugios que gestionas.',
    ),
    feedback,
    el(
      'div',
      { class: 'row g-4' },
      el(
        'section',
        { class: 'col-lg-4', 'aria-labelledby': 'register-heading' },
        el(
          'div',
          { class: 'card' },
          el(
            'div',
            { class: 'card-body' },
            el(
              'h2',
              { class: 'h5 card-title mb-3', id: 'register-heading' },
              'Registrar administrador',
            ),
            form.element,
          ),
        ),
      ),
      el(
        'section',
        { class: 'col-lg-8', 'aria-labelledby': 'list-heading' },
        el('h2', { class: 'h5 mb-3', id: 'list-heading' }, 'Administradores registrados'),
        listMount,
      ),
    ),
  );
}

export function createAdministratorsPage({
  api = defaultApi,
  confirmAction = defaultConfirm,
} = {}) {
  let shelters = [];
  const feedback = el('div', { id: 'feedback' });
  const listMount = el('div', { id: 'administrators-list' });
  const form = createAdministratorForm({ onSubmit: registerAdministrator });

  const shelterNameOf = (shelterId) =>
    shelters.find((shelter) => shelter.id === shelterId)?.name ?? `Refugio ${shelterId}`;

  async function loadShelters() {
    try {
      shelters = await api.listShelters();
    } catch (error) {
      shelters = [];
      showAlert(feedback, {
        kind: 'warning',
        message: `No pudimos cargar los refugios. ${friendlyMessage(error)}`,
      });
    }
  }

  async function refreshList() {
    renderLoading(listMount, 'Cargando administradores…');
    try {
      const administrators = await api.listAdministrators();
      renderAdministratorList(listMount, {
        administrators,
        shelters,
        onAssociate: associateSelectedShelters,
        onDelete: removeAdministrator,
      });
    } catch (error) {
      renderError(listMount, { text: friendlyMessage(error), onRetry: refreshList });
    }
  }

  async function registerAdministrator(values) {
    const errors = validateAdministrator(values);
    form.showErrors(errors);
    if (Object.keys(errors).length > 0) return;

    form.setBusy(true);
    try {
      const administrator = normalize(values);
      await api.createAdministrator(administrator);
      form.reset();
      showAlert(feedback, {
        kind: 'success',
        message: `Administrador ${administrator.name} registrado.`,
      });
      await refreshList();
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    } finally {
      form.setBusy(false);
    }
  }

  async function associateSelectedShelters(administrator, shelterIds) {
    if (shelterIds.length === 0) {
      showAlert(feedback, { kind: 'warning', message: 'Selecciona al menos un refugio.' });
      return;
    }
    const result = await associateShelters(api.associateShelter, administrator.id, shelterIds);
    showAlert(feedback, summarizeAssociation(administrator.name, result, shelterNameOf));
    if (result.associated.length > 0) await refreshList();
  }

  async function removeAdministrator(administrator) {
    if (!confirmAction(`¿Seguro que quieres eliminar a ${administrator.name}?`)) return;
    try {
      await api.deleteAdministrator(administrator.id);
      showAlert(feedback, {
        kind: 'success',
        message: `Administrador ${administrator.name} eliminado.`,
      });
      await refreshList();
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    }
  }

  async function load() {
    await loadShelters();
    await refreshList();
  }

  return { element: buildLayout({ feedback, form, listMount }), load };
}

export async function initAdministratorsPage(doc = document, options = {}) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'administrators' });

  const page = createAdministratorsPage(options);
  clear(app).append(page.element);
  await page.load();
}
