import { renderReportsPage } from './pages/reportsPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document, search = window.location.search) {
  return bootPage((app) => renderReportsPage(app, { search }), { current: 'reports', doc });
}

init();
