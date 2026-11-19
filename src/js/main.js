import { NAV_LINKS } from './config.js';
import { renderHeader } from './components/header.js';
import { renderHome } from './pages/homePage.js';

export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'home' });
  const app = doc.getElementById('app');
  return app ? renderHome(app) : Promise.resolve();
}

void init();
