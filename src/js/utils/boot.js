import { renderHeader } from '../components/header.js';
import { NAV_LINKS } from '../config.js';

export function bootPage(render, { current, doc = document } = {}) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current });
  const app = doc.getElementById('app');
  return app ? render(app) : Promise.resolve();
}
