import { el, clear } from '../utils/dom.js';

const ARIA_ROLE_BY_KIND = { success: 'status', info: 'status', warning: 'alert', danger: 'alert' };

/** Muestra una alerta de Bootstrap (success, info, warning o danger) con detalles opcionales. */
export function showAlert(container, { kind = 'info', message, details = [] }) {
  const closeButton = el('button', {
    class: 'btn-close',
    type: 'button',
    'aria-label': 'Cerrar',
    onClick: () => clear(container),
  });
  const detailList = details.length
    ? el('ul', { class: 'mb-0 mt-2' }, ...details.map((detail) => el('li', {}, detail)))
    : null;

  const alert = el(
    'div',
    { class: `alert alert-${kind} alert-dismissible mb-3`, role: ARIA_ROLE_BY_KIND[kind] },
    el('div', {}, message),
    detailList,
    closeButton,
  );
  clear(container).append(alert);
}
