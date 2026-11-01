import { el, clear } from '../utils/dom.js';
import { formatLongDate, toIsoDate } from '../utils/format.js';

const NO_TERMS_TEXT = 'Este contrato no tiene términos y condiciones registrados.';

/** Divide el texto de los términos en párrafos (uno por línea no vacía). */
export function splitTerms(terms) {
  if (typeof terms !== 'string') return [];
  return terms
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function dateValue(signedDate) {
  const isoDate = toIsoDate(signedDate);
  const label = formatLongDate(signedDate);
  return isoDate ? el('time', { datetime: isoDate }, label) : label;
}

function termsSection(terms) {
  const paragraphs = splitTerms(terms);
  const body =
    paragraphs.length > 0
      ? paragraphs.map((text) => el('p', {}, text))
      : [el('p', { class: 'contract__empty' }, NO_TERMS_TEXT)];

  return el(
    'section',
    { class: 'contract__section', 'aria-labelledby': 'contract-terms-title' },
    el('h2', { id: 'contract-terms-title', class: 'contract__heading' }, 'Términos y condiciones'),
    el('div', { class: 'contract__terms' }, ...body),
  );
}

/** Pinta el contrato: fecha, términos y condiciones. Los textos se insertan como texto, no como HTML. */
export function renderContract(container, contract) {
  const number = contract.id === undefined || contract.id === null ? null : `n.º ${contract.id}`;

  container.setAttribute('aria-busy', 'false');
  clear(container).append(
    el(
      'article',
      { class: 'contract' },
      el(
        'dl',
        { class: 'contract__meta' },
        number
          ? el('div', { class: 'contract__fact' }, el('dt', {}, 'Contrato'), el('dd', {}, number))
          : null,
        el(
          'div',
          { class: 'contract__fact' },
          el('dt', {}, 'Fecha del contrato'),
          el('dd', {}, dateValue(contract.signedDate)),
        ),
      ),
      termsSection(contract.termsAndConditions),
    ),
  );
}
