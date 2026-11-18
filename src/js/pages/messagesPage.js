import * as messagesApi from '../api/messagesApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { shelterField } from '../components/shelterPicker.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import {
  feedback,
  field,
  panel,
  readForm,
  replaceContent,
  runTask,
  setOptions,
} from '../utils/ui.js';

export const MAX_MESSAGE_LENGTH = 1000;

export const ROLE_OPTIONS = [
  { value: 'ADOPTER', label: 'Soy adoptante o interesado' },
  { value: 'SHELTER', label: 'Soy del refugio' },
];

/** Valida un mensaje; devuelve el texto del problema o `null`. */
export function validateMessage({ senderName, content, senderRole }) {
  if (!senderName) return 'Escribe tu nombre.';
  if (!ROLE_OPTIONS.some((option) => option.value === senderRole)) return 'Indica quién escribe.';
  if (!content) return 'Escribe tu mensaje.';
  if (content.length > MAX_MESSAGE_LENGTH)
    return `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`;
  return null;
}

const timeLabel = (sentAt) =>
  typeof sentAt === 'string' ? sentAt.slice(0, 16).replace('T', ' ') : '';

/** Mensajería con un refugio, opcionalmente sobre una mascota concreta. */
export async function renderMessagesPage(
  mount,
  { api = messagesApi, fetchShelters = listShelters, search = window.location.search } = {},
) {
  const params = new URLSearchParams(search);
  let shelters = [];

  const shelter = shelterField([], params.get('shelter') ?? '');
  const pet = field({
    label: 'Mascota (opcional)',
    name: 'pet',
    options: [{ value: '', label: 'Todas' }],
    value: params.get('pet') ?? '',
  });
  const thread = el('div', { 'aria-live': 'polite' });
  const formMount = el('div');

  const currentShelter = () => shelters.find((item) => String(item.id) === shelter.control.value);

  function paintPets() {
    setOptions(
      pet.control,
      (currentShelter()?.pets ?? []).map((item) => ({ value: item.id, label: item.name })),
      'Todas',
    );
  }

  async function loadThread() {
    const selected = currentShelter();
    if (!selected) {
      replaceContent(formMount);
      renderEmpty(thread, {
        title: 'Elige un refugio',
        text: 'Selecciona un refugio para ver y enviar mensajes.',
      });
      return;
    }
    renderLoading(thread, 'Cargando mensajes…');
    try {
      const messages = await api.listMessages(selected.id, {
        petId: pet.control.value || undefined,
      });
      thread.setAttribute('aria-busy', 'false');
      replaceContent(
        thread,
        messages?.length
          ? el(
              'div',
              { class: 'fx-chat' },
              ...messages.map((message) =>
                el(
                  'div',
                  {
                    class: `fx-bubble${message.senderRole === 'SHELTER' ? ' fx-bubble--shelter' : ''}`,
                  },
                  el('p', { class: 'fx-item__title' }, message.senderName),
                  el('p', {}, message.content),
                  el('p', { class: 'fx-item__meta' }, timeLabel(message.sentAt)),
                ),
              ),
            )
          : el('p', { class: 'fx-item__meta' }, 'Todavía no hay mensajes. Escribe el primero.'),
      );
      paintForm(selected);
    } catch (error) {
      renderError(thread, {
        title: 'No pudimos cargar los mensajes',
        text: friendlyMessage(error),
        onRetry: loadThread,
      });
    }
  }

  function paintForm(selected) {
    const name = field({ label: 'Tu nombre', name: 'senderName', required: true, maxlength: 100 });
    const role = field({ label: 'Quién escribe', name: 'senderRole', options: ROLE_OPTIONS });
    const content = field({
      label: 'Mensaje',
      name: 'content',
      rows: 3,
      required: true,
      maxlength: MAX_MESSAGE_LENGTH,
    });
    const fb = feedback();
    const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, 'Enviar');
    const form = el(
      'form',
      {
        class: 'fx-form',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const values = readForm(form);
          const problem = validateMessage(values);
          if (problem) return fb.error(problem);
          const ok = await runTask({ button: submit, fb, pendingLabel: 'Enviando…' }, () =>
            api.sendMessage(selected.id, {
              ...values,
              petId: pet.control.value ? Number(pet.control.value) : undefined,
            }),
          );
          if (ok) await loadThread();
          return undefined;
        },
      },
      name.root,
      role.root,
      content.root,
      submit,
    );
    replaceContent(formMount, panel('Escribir al refugio', form, fb.node));
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'COMUNICACIÓN'),
    el('h1', { class: 'page-title' }, 'Mensajes con el refugio'),
    el('p', { class: 'page-lead' }, 'Resuelve dudas sobre una mascota o coordina una visita.'),
    el('div', { class: 'fx-toolbar' }, shelter.root, pet.root),
    thread,
    formMount,
  );

  shelter.control.addEventListener('change', () => {
    paintPets();
    loadThread();
  });
  pet.control.addEventListener('change', loadThread);

  try {
    shelters = (await fetchShelters()) ?? [];
    setOptions(
      shelter.control,
      shelters.map((item) => ({
        value: item.id,
        label: item.city ? `${item.name} · ${item.city}` : item.name,
      })),
      'Selecciona un refugio',
    );
    if (params.get('shelter')) shelter.control.value = params.get('shelter');
    paintPets();
    if (params.get('pet')) pet.control.value = params.get('pet');
  } catch (error) {
    renderError(thread, { title: 'No pudimos cargar los refugios', text: friendlyMessage(error) });
    return undefined;
  }
  return loadThread();
}
