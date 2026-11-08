import { NAV_LINKS } from './config.js';
import { renderHeader } from './components/header.js';
import { renderEmpty } from './components/stateViews.js';
import { renderPetEventsPage } from './pages/petEventsPage.js';
import { getQueryParam } from './utils/dom.js';

/** Página `eventos.html?petId=<id>`. Devuelve la promesa de la carga inicial. */
export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'pets' });

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const petId = getQueryParam('petId', search);
  if (!/^\d+$/.test(String(petId))) {
    renderEmpty(app, {
      title: 'Falta la mascota',
      text: 'Abre esta página desde el detalle de una mascota.',
    });
    return Promise.resolve();
  }
  return renderPetEventsPage(app, petId);
}

init();
