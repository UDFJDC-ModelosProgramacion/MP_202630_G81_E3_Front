import { renderEmpty } from './components/stateViews.js';
import { renderVaccinationsPage } from './pages/vaccinationsPage.js';
import { bootPage } from './utils/boot.js';
import { getQueryParam } from './utils/dom.js';

/** Página `vacunacion.html?pet=<id>` (también acepta `petId`). */
export function init(doc = document, search = window.location.search) {
  return bootPage(
    (app) => {
      const petId = getQueryParam('pet', search) ?? getQueryParam('petId', search);
      if (!/^\d+$/.test(String(petId))) {
        renderEmpty(app, {
          title: 'Falta la mascota',
          text: 'Abre esta página desde el detalle de una mascota.',
        });
        return Promise.resolve();
      }
      return renderVaccinationsPage(app, petId);
    },
    { current: 'pets', doc },
  );
}

init();
