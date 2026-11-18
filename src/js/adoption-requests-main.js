import { renderAdoptionRequestsPage } from './pages/adoptionRequestsPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document) {
  return bootPage((app) => renderAdoptionRequestsPage(app), { current: 'requests', doc });
}

init();
