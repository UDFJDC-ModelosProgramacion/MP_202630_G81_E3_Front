import { renderHeader } from './components/header.js';
import { renderLoginPage } from './pages/loginPage.js';

export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { current: 'login' });
  const app = doc.getElementById('app');
  return app ? renderLoginPage(app, { search }) : Promise.resolve();
}

init();
