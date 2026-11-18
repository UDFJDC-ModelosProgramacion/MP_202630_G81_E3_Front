import { clear, el } from './dom.js';
import { friendlyMessage } from './errors.js';

let counter = 0;
const nextId = (name) => `fx-${name}-${++counter}`;

/** Encabezado de página: etiqueta, título y bajada. */
export function pageHeader({ eyebrow, title, lead }) {
  return [
    eyebrow ? el('p', { class: 'eyebrow' }, eyebrow) : null,
    el('h1', { class: 'page-title' }, title),
    lead ? el('p', { class: 'page-lead' }, lead) : null,
  ];
}

/**
 * Campo de formulario con etiqueta. Con `options` es un selector, con `rows` un área de
 * texto y en otro caso un input del `type` indicado. Devuelve `{ root, control }`.
 */
export function field({
  label,
  name,
  type = 'text',
  value = '',
  required = false,
  options,
  rows,
  hint,
  ...attrs
}) {
  const id = nextId(name);
  let control;
  if (options) {
    control = el(
      'select',
      { class: 'fx-control', id, name, required },
      ...optionNodes(options, value),
    );
  } else if (rows) {
    control = el('textarea', { class: 'fx-control', id, name, rows, required, ...attrs }, value);
  } else {
    control = el('input', { class: 'fx-control', id, name, type, value, required, ...attrs });
  }
  const root = el(
    'div',
    { class: 'fx-field' },
    el('label', { class: 'fx-label', for: id }, label),
    control,
    hint ? el('p', { class: 'fx-hint' }, hint) : null,
  );
  return { root, control };
}

function optionNodes(options, value = '') {
  return options.map((option) =>
    el(
      'option',
      { value: option.value, selected: String(option.value) === String(value) },
      option.label,
    ),
  );
}

/** Reemplaza las opciones de un selector, conservando la primera como invitación. */
export function setOptions(select, options, placeholder) {
  const previous = select.value;
  select.replaceChildren(
    ...(placeholder === undefined ? [] : [el('option', { value: '' }, placeholder)]),
    ...optionNodes(options, previous),
  );
}

/** Mensaje de éxito o de error bajo un formulario. */
export function feedback() {
  const node = el('p', { class: 'fx-feedback', role: 'status', 'aria-live': 'polite' });
  return {
    node,
    success(message) {
      node.className = 'fx-feedback fx-feedback--success';
      node.textContent = message;
    },
    error(message) {
      node.className = 'fx-feedback fx-feedback--error';
      node.textContent = message;
    },
    clear() {
      node.className = 'fx-feedback';
      node.textContent = '';
    },
  };
}

/** Ejecuta `task` bloqueando el botón; los errores se muestran en `fb`. Devuelve si salió bien. */
export async function runTask({ button, fb, pendingLabel = 'Guardando…' }, task) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = pendingLabel;
  fb.clear();
  try {
    await task();
    return true;
  } catch (error) {
    fb.error(friendlyMessage(error));
    return false;
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

/** Valores de un formulario como objeto de textos sin espacios sobrantes. */
export function readForm(form) {
  return Object.fromEntries(
    [...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()]),
  );
}

/** Panel con título (contenedor visual de una sección). */
export function panel(title, ...children) {
  return el(
    'section',
    { class: 'fx-panel' },
    title ? el('h2', { class: 'fx-panel__title' }, title) : null,
    ...children,
  );
}

/** Etiqueta de color según un `kind` (success, warning, danger o neutral). */
export function tag(text, kind = 'neutral') {
  return el('span', { class: `fx-tag fx-tag--${kind}` }, text);
}

export function replaceContent(node, ...children) {
  clear(node).append(...children);
  return node;
}

/** Hoy en formato yyyy-mm-dd (hora local). */
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
