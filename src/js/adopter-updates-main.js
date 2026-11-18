import { renderAdopterUpdatesPage } from './pages/adopterUpdatesPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document, search = window.location.search) {
  return bootPage((app) => renderAdopterUpdatesPage(app, { search }), {
    current: 'adopter-updates',
    doc,
  });
}

init();
