import { sortFollowUps, statusLabel } from '../domain/followUps.js';
import { clear, el } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';
import { renderEmpty } from './stateViews.js';

function followUpCard(followUp) {
  const iso = toIsoDate(followUp.date);
  return el(
    'li',
    { class: 'review-card' },
    el(
      'div',
      { class: 'followup-card__header' },
      el('time', { datetime: iso ?? false }, formatLongDate(followUp.date)),
      el('span', { class: 'chip' }, statusLabel(followUp.adaptationStatus)),
    ),
    el('p', { class: 'review-card__comment' }, followUp.observations),
  );
}

/** Pinta el historial del más reciente al más antiguo, o el estado vacío si no hay registros. */
export function renderFollowUpHistory(container, followUps) {
  if (followUps.length === 0) {
    renderEmpty(container, {
      title: 'Aún no hay seguimientos',
      text: 'Registra el primero para empezar el historial de adaptación.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el('ul', { class: 'review-list' }, ...sortFollowUps(followUps).map(followUpCard)),
  );
}
