import { NAV_LINKS } from './config.js';
import { renderHeader } from './components/header.js';
import { renderPetsPage } from './pages/petsPage.js';

export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'pets' });

  const app = doc.getElementById('app');
  if (app) renderPetsPage(app);
}

init();
