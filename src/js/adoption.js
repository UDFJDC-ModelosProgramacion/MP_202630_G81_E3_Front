import { getAdoption } from './api/adoptionsApi.js';
import { renderAdoptionProcess } from './components/adoptionProcess.js';
import { renderHeader } from './components/header.js';
import { renderEmpty, renderError, renderLoading } from './components/stateViews.js';
import { NAV_LINKS } from './config.js';
import { clear, el, getQueryParam } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

const isValidId = (value) => /^\d+$/.test(String(value));

export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'requests' });

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const adoptionId = getQueryParam('adoption', search);
  if (!isValidId(adoptionId)) {
    renderEmpty(app, {
      title: 'Falta la adopción',
      text: 'Abre esta página desde una adopción para revisar la información de su proceso.',
    });
    return Promise.resolve();
  }

  const processMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Proceso de adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Revisa la información de tu adopción y verifica que sea correcta.',
    ),
    processMount,
  );

  async function loadAdoption() {
    renderLoading(processMount, 'Cargando información de la adopción…');
    try {
      const adoption = await getAdoption(adoptionId);
      if (adoption) {
        renderAdoptionProcess(processMount, adoption);
      } else {
        renderEmpty(processMount, {
          title: 'No encontramos la adopción',
          text: 'Verifica el enlace e inténtalo de nuevo.',
        });
      }
    } catch (error) {
      renderError(processMount, {
        title: 'No pudimos cargar la adopción',
        text: friendlyMessage(error),
        onRetry: loadAdoption,
      });
    }
  }

  return loadAdoption();
}

void init();
