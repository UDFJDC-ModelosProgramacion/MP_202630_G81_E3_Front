import { renderVetAdoptionsPage } from './pages/vetAdoptionsPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document, search = window.location.search) {
  return bootPage((app) => renderVetAdoptionsPage(app, { search }), {
    current: 'vet-adoptions',
    doc,
  });
}

init();
