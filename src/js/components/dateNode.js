import { el } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';

export function dateNode(value) {
  const isoDate = toIsoDate(value);
  const label = formatLongDate(value);
  return isoDate ? el('time', { datetime: isoDate }, label) : label;
}
