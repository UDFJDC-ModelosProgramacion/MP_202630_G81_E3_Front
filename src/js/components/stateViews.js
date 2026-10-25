import { el, clear } from '../utils/dom.js';

function stateBlock(kind, role, { title, text, actionLabel, onAction }) {
  return el(
    'div',
    { class: `state state--${kind}`, role },
    title ? el('h2', { class: 'state__title' }, title) : null,
    text ? el('p', { class: 'state__text' }, text) : null,
    actionLabel && onAction
      ? el('button', { class: 'btn btn--primary', type: 'button', onClick: onAction }, actionLabel)
      : null,
  );
}

function show(container, busy, block) {
  container.setAttribute('aria-busy', busy ? 'true' : 'false');
  clear(container).append(block);
}

/** Estado de carga (loader accesible). */
export function renderLoading(container, label = 'Cargando…') {
  const block = el(
    'div',
    { class: 'state state--loading', role: 'status' },
    el('span', { class: 'spinner', 'aria-hidden': 'true' }),
    el('p', { class: 'state__text' }, label),
  );
  show(container, true, block);
}

/** Estado vacío: sin datos o sin resultados. La acción es opcional. */
export function renderEmpty(container, options = {}) {
  show(container, false, stateBlock('empty', 'status', options));
}

/** Estado de error con acción opcional de reintento. */
export function renderError(
  container,
  {
    title = 'No pudimos cargar la información',
    text = 'Revisa tu conexión e inténtalo de nuevo.',
    onRetry,
  } = {},
) {
  show(
    container,
    false,
    stateBlock('error', 'alert', {
      title,
      text,
      actionLabel: onRetry ? 'Reintentar' : undefined,
      onAction: onRetry,
    }),
  );
}
