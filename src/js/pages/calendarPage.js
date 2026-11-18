import * as shelterEventsApi from '../api/shelterEventsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { shelterField } from '../components/shelterPicker.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { EVENT_TYPES, calendarTypeLabel, filterByType } from '../domain/calendar.js';
import { el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { formatDate } from '../utils/format.js';
import {
  feedback,
  field,
  panel,
  readForm,
  replaceContent,
  runTask,
  setOptions,
  tag,
  todayIso,
} from '../utils/ui.js';

/** Valida un evento del calendario; devuelve el texto del problema o `null`. */
export function validateCalendarEvent({ type, title, date }) {
  if (!EVENT_TYPES.some((option) => option.value === type)) return 'Elige el tipo de evento.';
  if (!title) return 'El título es obligatorio.';
  if (title.length > 255) return 'El título no puede superar los 255 caracteres.';
  if (!date) return 'La fecha es obligatoria.';
  return null;
}

/** Calendario de un refugio: ferias de adopción, talleres y jornadas de vacunación. */
export async function renderCalendarPage(
  mount,
  { api = shelterEventsApi, fetchShelters = listShelters, search = window.location.search } = {},
) {
  const params = new URLSearchParams(search);
  let events = [];

  const shelter = shelterField([], params.get('shelter') ?? '');
  const typeFilter = field({
    label: 'Tipo',
    name: 'typeFilter',
    options: [{ value: '', label: 'Todos' }, ...EVENT_TYPES],
  });
  const list = el('div', { 'aria-live': 'polite' });
  const formMount = el('div');
  const selectedId = () => shelter.control.value;

  function paintList() {
    const visible = filterByType(events, typeFilter.control.value);
    list.setAttribute('aria-busy', 'false');
    if (!visible.length) {
      renderEmpty(list, { title: 'Sin eventos', text: 'No hay eventos para este filtro.' });
      return;
    }
    replaceContent(
      list,
      el(
        'ul',
        { class: 'fx-list' },
        ...visible.map((event) =>
          el(
            'li',
            { class: 'fx-item' },
            el(
              'div',
              {},
              el('p', { class: 'fx-item__title' }, event.title ?? calendarTypeLabel(event.type)),
              el(
                'p',
                { class: 'fx-item__meta' },
                `${formatDate(event.date)} · `,
                tag(calendarTypeLabel(event.type)),
              ),
              event.description ? el('p', { class: 'fx-item__meta' }, event.description) : null,
            ),
            el(
              'button',
              {
                class: 'btn btn--outline',
                type: 'button',
                onClick: async () => {
                  try {
                    await api.deleteShelterEvent(selectedId(), event.id);
                    await load();
                  } catch (error) {
                    renderError(list, {
                      title: 'No pudimos eliminar el evento',
                      text: friendlyMessage(error),
                      onRetry: load,
                    });
                  }
                },
              },
              'Eliminar',
            ),
          ),
        ),
      ),
    );
  }

  function paintForm() {
    const type = field({ label: 'Tipo de evento', name: 'type', options: EVENT_TYPES });
    const title = field({ label: 'Título', name: 'title', required: true, maxlength: 255 });
    const date = field({
      label: 'Fecha',
      name: 'date',
      type: 'date',
      required: true,
      value: todayIso(),
    });
    const description = field({
      label: 'Descripción (opcional)',
      name: 'description',
      maxlength: 255,
    });
    const fb = feedback();
    const submit = el(
      'button',
      { class: 'btn btn--primary', type: 'submit' },
      'Agregar al calendario',
    );
    const form = el(
      'form',
      {
        class: 'fx-form fx-form--grid',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const values = readForm(form);
          const problem = validateCalendarEvent(values);
          if (problem) return fb.error(problem);
          const ok = await runTask({ button: submit, fb }, () =>
            api.createShelterEvent(selectedId(), {
              ...values,
              description: values.description || null,
            }),
          );
          if (ok) {
            await load();
            fb.success('Evento agregado.');
          }
          return undefined;
        },
      },
      type.root,
      title.root,
      date.root,
      description.root,
      submit,
    );
    replaceContent(formMount, panel('Nuevo evento', form, fb.node));
  }

  async function load() {
    if (!selectedId()) {
      replaceContent(formMount);
      renderEmpty(list, {
        title: 'Elige un refugio',
        text: 'Selecciona un refugio para ver su calendario.',
      });
      return;
    }
    renderLoading(list, 'Cargando calendario…');
    try {
      events = (await api.listShelterEvents(selectedId())) ?? [];
      paintList();
      paintForm();
    } catch (error) {
      renderError(list, {
        title: 'No pudimos cargar el calendario',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'REFUGIO'),
    el('h1', { class: 'page-title' }, 'Calendario de eventos'),
    el(
      'p',
      { class: 'page-lead' },
      'Ferias de adopción, talleres de cuidado y jornadas de vacunación.',
    ),
    el('div', { class: 'fx-toolbar' }, shelter.root, typeFilter.root),
    list,
    formMount,
  );
  shelter.control.addEventListener('change', load);
  typeFilter.control.addEventListener('change', paintList);

  try {
    const shelters = (await fetchShelters()) ?? [];
    setOptions(
      shelter.control,
      shelters.map((item) => ({
        value: item.id,
        label: item.city ? `${item.name} · ${item.city}` : item.name,
      })),
      'Selecciona un refugio',
    );
    if (params.get('shelter')) shelter.control.value = params.get('shelter');
  } catch (error) {
    renderError(list, { title: 'No pudimos cargar los refugios', text: friendlyMessage(error) });
    return undefined;
  }
  return load();
}
