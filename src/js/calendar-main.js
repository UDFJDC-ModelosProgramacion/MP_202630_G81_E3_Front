import { renderCalendarPage } from './pages/calendarPage.js';
import { bootPage } from './utils/boot.js';

export function init(doc = document, search = window.location.search) {
  return bootPage((app) => renderCalendarPage(app, { search }), { current: 'calendar', doc });
}

init();
