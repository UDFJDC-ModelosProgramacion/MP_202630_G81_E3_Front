import { availableMedicalFields, sortMedicalRecords } from '../domain/medicalHistory.js';
import { clear, el } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';
import { renderEmpty } from './stateViews.js';

export const NO_RECORDS_MESSAGE = 'No existen registros médicos disponibles';

function recordCard(record) {
  const fields = availableMedicalFields(record);
  return el(
    'li',
    { class: 'card' },
    el(
      'div',
      { class: 'card-body' },
      el(
        'h3',
        { class: 'h6 card-title' },
        'Atención del ',
        el('time', { datetime: toIsoDate(record.date) ?? false }, formatLongDate(record.date)),
      ),
      fields.length
        ? el(
            'dl',
            { class: 'mb-0' },
            ...fields.flatMap((field) => [el('dt', {}, field.label), el('dd', {}, field.value)]),
          )
        : el('p', { class: 'text-body-secondary mb-0' }, 'Sin más datos registrados.'),
    ),
  );
}

/**
 * Pinta el historial médico del más reciente al más antiguo. De cada registro muestra solo los
 * datos disponibles (motivo, diagnóstico, tratamiento). Sin registros avisa que no existen.
 */
export function renderMedicalRecordList(container, records) {
  if (records.length === 0) {
    renderEmpty(container, {
      title: NO_RECORDS_MESSAGE,
      text: 'Cuando se registre una atención aparecerá aquí.',
    });
    return;
  }
  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'ul',
      { class: 'list-unstyled d-grid gap-3 m-0 p-0' },
      ...sortMedicalRecords(records).map(recordCard),
    ),
  );
}
