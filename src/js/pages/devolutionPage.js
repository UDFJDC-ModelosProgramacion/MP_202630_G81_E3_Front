import * as adoptionsApi from '../api/adoptionsApi.js';
import * as devolutionApi from '../api/devolutionApi.js';
import { showAlert } from '../components/alert.js';
import { renderAdoptionSummary } from '../components/adoptionSummary.js';
import { createDevolutionForm } from '../components/devolutionForm.js';
import { renderDevolution } from '../components/devolutionView.js';
import { renderHeader } from '../components/header.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { validateDevolution } from '../domain/devolution.js';
import { clear, el, getQueryParam } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

export const NOT_FOUND_TITLE = 'Adopción no encontrada';

const defaultApi = { ...adoptionsApi, ...devolutionApi };

const isValidId = (value) => /^\d+$/.test(String(value));
const isNotFound = (error) => error?.status === 404;

function normalize({ date, reason }) {
  return { date: String(date ?? '').trim(), reason: String(reason ?? '').trim() };
}

function createDevolutionPage({ api, adoptionId }) {
  let adoption = null;
  const feedback = el('div', { id: 'feedback' });
  const summaryMount = el('div', { class: 'mb-4' });
  const devolutionMount = el('div', { 'aria-live': 'polite' });
  const form = createDevolutionForm({ onSubmit: registerDevolution });

  const element = el(
    'div',
    {},
    el('h1', { class: 'page-title' }, 'Devolución de la adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Deja constancia de por qué la mascota volvió al refugio y de la fecha en que ocurrió.',
    ),
    feedback,
    summaryMount,
    devolutionMount,
  );

  function paintDevolution(devolution) {
    if (devolution) {
      renderDevolution(devolutionMount, devolution);
      return;
    }
    devolutionMount.setAttribute('aria-busy', 'false');
    clear(devolutionMount).append(
      el(
        'section',
        { class: 'card', 'aria-labelledby': 'devolution-form-title' },
        el(
          'div',
          { class: 'card-body' },
          el(
            'h2',
            { class: 'h5 card-title mb-1', id: 'devolution-form-title' },
            'Registrar devolución',
          ),
          el(
            'p',
            { class: 'text-body-secondary' },
            'Esta adopción aún no tiene una devolución registrada.',
          ),
          form.element,
        ),
      ),
    );
  }

  async function registerDevolution(values) {
    const data = normalize(values);
    const errors = validateDevolution(data, adoption?.adoptionDate);
    form.showErrors(errors);
    if (Object.keys(errors).length > 0) return;

    form.setBusy(true);
    try {
      const devolution = await api.createDevolution(adoptionId, data);
      showAlert(feedback, { kind: 'success', message: 'Devolución registrada correctamente.' });
      paintDevolution(devolution);
    } catch (error) {
      showAlert(feedback, { kind: 'danger', message: friendlyMessage(error) });
    } finally {
      form.setBusy(false);
    }
  }

  async function load() {
    renderLoading(devolutionMount, 'Cargando adopción…');
    try {
      const [loadedAdoption, devolution] = await Promise.all([
        api.getAdoption(adoptionId),
        api.getDevolution(adoptionId).catch((error) => {
          if (isNotFound(error)) return null;
          throw error;
        }),
      ]);
      adoption = loadedAdoption;
      renderAdoptionSummary(summaryMount, adoption);
      paintDevolution(devolution);
    } catch (error) {
      clear(summaryMount);
      if (isNotFound(error)) {
        renderEmpty(devolutionMount, {
          title: NOT_FOUND_TITLE,
          text: 'Revisa el enlace: no existe una adopción con ese identificador.',
        });
        return;
      }
      renderError(devolutionMount, {
        title: 'No pudimos cargar la adopción',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  return { element, load };
}

export async function initDevolutionPage(
  doc = document,
  { api = defaultApi, search = window.location.search } = {},
) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'requests' });

  const adoptionId = getQueryParam('adoption', search);
  if (!isValidId(adoptionId)) {
    renderEmpty(app, {
      title: 'Falta la adopción',
      text: 'Abre esta página desde una adopción para registrar o consultar su devolución.',
    });
    return;
  }

  const page = createDevolutionPage({ api, adoptionId });
  clear(app).append(page.element);
  await page.load();
}
