import { renderSuccessStoriesPage } from './pages/successStoriesPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document) {
  return bootPage((app) => renderSuccessStoriesPage(app), { current: 'stories', doc });
}

init();
