import { clear, el } from '../utils/dom.js';
import { dateNode } from './dateNode.js';

export function renderDevolution(container, devolution) {
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'section',
      { class: 'card', 'aria-labelledby': 'devolution-title' },
      el(
        'div',
        { class: 'card-body' },
        el('h2', { class: 'h5 card-title mb-3', id: 'devolution-title' }, 'Devolución registrada'),
        el(
          'dl',
          { class: 'row mb-0' },
          el('dt', { class: 'col-sm-4' }, 'Fecha de la devolución'),
          el('dd', { class: 'col-sm-8' }, dateNode(devolution.date)),
          el('dt', { class: 'col-sm-4' }, 'Motivo'),
          el('dd', { class: 'col-sm-8 mb-0 text-break' }, devolution.reason),
        ),
      ),
    ),
  );
}
