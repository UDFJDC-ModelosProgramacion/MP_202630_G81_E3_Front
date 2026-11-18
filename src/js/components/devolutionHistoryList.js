import {
  adopterNameOf,
  petNameOf,
  sortDevolutions,
} from '../domain/devolutionHistory.js';
import { clear, el } from '../utils/dom.js';
import { dateNode } from './dateNode.js';
import { renderEmpty } from './stateViews.js';

export const NO_DEVOLUTIONS_TITLE = 'Aún no hay devoluciones registradas';

/** Enlace al detalle de la adopción de una devolución. */
export const devolutionHref = (adoptionId) =>
  `devolution.html?adoption=${encodeURIComponent(adoptionId)}`;

function detailLink(devolution) {
  const adoptionId = devolution.adoption?.id;
  if (adoptionId === undefined || adoptionId === null) return null;
  return el(
    'a',
    { class: 'btn btn-sm btn-outline-primary', href: devolutionHref(adoptionId) },
    'Ver adopción',
  );
}

function devolutionRow(devolution) {
  return el(
    'tr',
    {},
    el('td', {}, dateNode(devolution.date)),
    el('th', { scope: 'row' }, petNameOf(devolution)),
    el('td', {}, adopterNameOf(devolution)),
    el('td', { class: 'text-break' }, devolution.reason ?? ''),
    el('td', { class: 'text-end' }, detailLink(devolution)),
  );
}

/**
 * Tabla del historial de devoluciones, de la más reciente a la más antigua.
 * Sin devoluciones muestra el estado vacío.
 */
export function renderDevolutionHistoryList(container, devolutions) {
  if (devolutions.length === 0) {
    renderEmpty(container, {
      title: NO_DEVOLUTIONS_TITLE,
      text: 'Cuando se registre una devolución aparecerá aquí.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'div',
      { class: 'table-responsive' },
      el(
        'table',
        { class: 'table table-hover align-middle' },
        el(
          'thead',
          {},
          el(
            'tr',
            {},
            el('th', { scope: 'col' }, 'Fecha'),
            el('th', { scope: 'col' }, 'Mascota'),
            el('th', { scope: 'col' }, 'Adoptante'),
            el('th', { scope: 'col' }, 'Motivo'),
            el('th', { scope: 'col', class: 'text-end' }, 'Acciones'),
          ),
        ),
        el('tbody', {}, ...sortDevolutions(devolutions).map(devolutionRow)),
      ),
    ),
  );
}