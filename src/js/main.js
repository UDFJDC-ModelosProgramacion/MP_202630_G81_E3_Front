import { renderHeader } from './components/header.js';

export function init(doc = document) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { current: 'home' });
}

init();
