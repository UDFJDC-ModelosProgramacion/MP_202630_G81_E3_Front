import { NAV_LINKS } from './config.js';
import { renderHeader } from './components/header.js';
import { renderAvailablePetsPage } from './pages/availablePetsPage.js';

export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'available' });

  const app = doc.getElementById('app');
  return app ? renderAvailablePetsPage(app) : Promise.resolve();
}

init();
