import { NAV_LINKS } from './config.js';
import { renderHeader } from './components/header.js';

/** Punto de entrada de la página**/
export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'home' });
}

init();
