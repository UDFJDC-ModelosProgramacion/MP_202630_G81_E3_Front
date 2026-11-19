import { renderEmpty } from './components/stateViews.js';
import { renderCoexistencePage } from './pages/coexistencePage.js';
import { bootPage } from './utils/boot.js';
import { getQueryParam } from './utils/dom.js';

export function init(doc = document, search = window.location.search) {
  return bootPage(
    (app) => {
      const adoptionId = getQueryParam('adoption', search);
      if (!/^\d+$/.test(String(adoptionId))) {
        renderEmpty(app, {
          title: 'Falta la adopción',
          text: 'Abre esta página desde la lista de solicitudes.',
        });
        return Promise.resolve();
      }
      return renderCoexistencePage(app, adoptionId);
    },
    { current: 'requests', doc },
  );
}

init();
