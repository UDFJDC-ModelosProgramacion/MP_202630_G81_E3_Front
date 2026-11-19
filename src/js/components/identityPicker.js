import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { field } from '../utils/ui.js';
import { renderEmpty, renderError, renderLoading } from './stateViews.js';

const goTo = (url) => window.location.assign(url);

export async function renderIdentityPicker(
  mount,
  { title, text, label, name, page, param, load, emptyTitle, emptyText, navigate = goTo },
) {
  renderLoading(mount, 'Cargando opciones…');
  let options;
  try {
    options = await load();
  } catch (error) {
    renderError(mount, {
      title: 'No pudimos cargar las opciones',
      text: friendlyMessage(error),
      onRetry: () =>
        renderIdentityPicker(mount, {
          title,
          text,
          label,
          name,
          page,
          param,
          load,
          emptyTitle,
          emptyText,
          navigate,
        }),
    });
    return;
  }
  if (options.length === 0) {
    renderEmpty(mount, { title: emptyTitle, text: emptyText });
    return;
  }
  const select = field({
    label,
    name,
    required: true,
    options: [{ value: '', label: `Selecciona…` }, ...options],
  });
  const form = el(
    'form',
    {
      class: 'fx-form fx-picker',
      onSubmit: (event) => {
        event.preventDefault();
        if (select.control.value) {
          navigate(`${page}?${param}=${encodeURIComponent(select.control.value)}`);
        }
      },
    },
    select.root,
    el('button', { class: 'btn btn--primary', type: 'submit' }, 'Continuar'),
  );
  clear(mount).append(
    el('h1', { class: 'page-title' }, title),
    el('p', { class: 'page-lead' }, text),
    form,
  );
}
