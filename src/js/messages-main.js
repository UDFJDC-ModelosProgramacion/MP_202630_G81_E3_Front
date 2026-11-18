import { renderMessagesPage } from './pages/messagesPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document, search = window.location.search) {
  return bootPage((app) => renderMessagesPage(app, { search }), { current: 'messages', doc });
}

init();
