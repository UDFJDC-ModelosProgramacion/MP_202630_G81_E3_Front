import { el } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';

/** Fecha legible en una etiqueta `time`; si no es válida, solo el texto "Fecha no disponible". */
export function dateNode(value) {
  const isoDate = toIsoDate(value);
  const label = formatLongDate(value);
  return isoDate ? el('time', { datetime: isoDate }, label) : label;
}
