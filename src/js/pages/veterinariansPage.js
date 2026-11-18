import { NAV_LINKS } from '../config.js';
import { createVeterinarian } from '../api/veterinariansApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { showAlert } from '../components/alert.js';
import { renderHeader } from '../components/header.js';
import { renderError, renderLoading } from '../components/stateViews.js';
import { createVeterinarianForm } from '../components/veterinarianForm.js';
import { renderVeterinarianList } from '../components/veterinarianList.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { validateVeterinarian } from '../utils/veterinarianValidation.js';

const defaultApi = { createVeterinarian, listShelters };

function buildLayout({ feedback, form, listMount }) {
  return el(
    'div',
    {},
    el('h1', { class: 'page-title' }, 'Veterinarios'),
    el(
      'p',
      { class: 'page-lead' },
      'Registra a los veterinarios de cada refugio y entra a su historial médico.',
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
              'Registrar veterinario',
            ),
            form.element,
          ),
        ),
      ),
      el(
        'section',
        { class: 'col-lg-8', 'aria-labelledby': 'list-heading' },
        el('h2', { class: 'h5 mb-3', id: 'list-heading' }, 'Veterinarios por refugio'),
        listMount,
      ),
    ),
  );
}

export function createVeterinariansPage({ api = defaultApi } = {}) {
  const feedback = el('div', { id: 'feedback' });
  const listMount = el('div', { id: 'veterinarians-list' });
  const form = createVeterinarianForm({ onSubmit: registerVeterinarian });

  async function refresh() {
    renderLoading(listMount, 'Cargando veterinarios…');
    try {
      const shelters = await api.listShelters();
      form.setShelters(shelters);
      renderVeterinarianList(listMount, { shelters });
    } catch (error) {
      renderError(listMount, { text: friendlyMessage(error), onRetry: refresh });
    }
  }

  async function registerVeterinarian(values) {
    const errors = validateVeterinarian(values);
    form.showErrors(errors);
    if (Object.keys(errors).length > 0) return;

    form.setBusy(true);
    try {
      const veterinarian = {
        name: values.name.trim(),
        speciality: values.speciality.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        availability: values.availability?.trim() || null,
      };
      await api.createVeterinarian(Number(values.shelterId), veterinarian);
      form.reset();
      showAlert(feedback, {
        kind: 'success',
        message: `Veterinario ${veterinarian.name} registrado.`,
      });
      await refresh();
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    } finally {
      form.setBusy(false);
    }
  }

  return { element: buildLayout({ feedback, form, listMount }), load: refresh };
}

export async function initVeterinariansPage(doc = document, options = {}) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'veterinarians' });

  const page = createVeterinariansPage(options);
  clear(app).append(page.element);
  await page.load();
}
