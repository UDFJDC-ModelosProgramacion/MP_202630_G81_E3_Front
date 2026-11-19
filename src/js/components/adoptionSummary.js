import { clear, el } from '../utils/dom.js';
import { dateNode } from './dateNode.js';

export function renderAdoptionSummary(container, adoption) {
  clear(container).append(
    el(
      'section',
      { class: 'card', 'aria-labelledby': 'adoption-summary-title' },
      el(
        'div',
        { class: 'card-body' },
        el('h2', { class: 'h5 card-title mb-3', id: 'adoption-summary-title' }, 'Adopción'),
        el(
          'dl',
          { class: 'row mb-0' },
          el('dt', { class: 'col-sm-4' }, 'Fecha de la adopción'),
          el('dd', { class: 'col-sm-8' }, dateNode(adoption.adoptionDate)),
          el('dt', { class: 'col-sm-4' }, 'Estado'),
          el(
            'dd',
            { class: 'col-sm-8 mb-0' },
            el('span', { class: 'badge text-bg-secondary' }, adoption.status ?? 'Sin estado'),
          ),
        ),
      ),
    ),
  );
}
