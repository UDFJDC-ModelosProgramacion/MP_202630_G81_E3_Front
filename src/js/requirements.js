import { listRequirements } from './api/requirementsApi.js';
import { renderHeader } from './components/header.js';
import { renderRequirementList } from './components/requirementList.js';
import { renderError, renderLoading } from './components/stateViews.js';
import { NAV_LINKS } from './config.js';
import { clear, el } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'requirements' });

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Requisitos para adoptar'),
    el(
      'p',
      { class: 'page-lead' },
      'Conoce lo que necesitas para adoptar a una mascota y revisa si estás listo para empezar.',
    ),
    listMount,
  );

  async function loadRequirements() {
    renderLoading(listMount, 'Cargando requisitos…');
    try {
      const requirements = await listRequirements();
      renderRequirementList(listMount, Array.isArray(requirements) ? requirements : []);
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar los requisitos',
        text: friendlyMessage(error),
        onRetry: loadRequirements,
      });
    }
  }

  return loadRequirements();
}

void init();
