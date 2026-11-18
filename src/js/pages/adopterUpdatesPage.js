import { getAdopter, listAdopters, updateAdopter } from '../api/adoptersApi.js';
import { ROLES, sessionUserId } from '../services/session.js';
import { createPetEvent } from '../api/petEventsApi.js';
import { addPetPhoto } from '../api/petManagementApi.js';
import { renderEmpty, renderError } from '../components/stateViews.js';
import { adoptionStatusLabel, isLivingWithAdopter } from '../domain/adoptionStatus.js';
import { el } from '../utils/dom.js';
import { FormError, friendlyMessage } from '../utils/errors.js';
import {
  feedback,
  field,
  panel,
  readForm,
  replaceContent,
  runTask,
  setOptions,
  todayIso,
} from '../utils/ui.js';

const defaultApi = { listAdopters, getAdopter, updateAdopter, createPetEvent, addPetPhoto };

export const EVENT_OPTIONS = [
  { value: 'ILLNESS', label: 'Enfermedad' },
  { value: 'ACCIDENT', label: 'Accidente' },
  { value: 'SURGERY', label: 'Cirugía' },
  { value: 'CHECKUP', label: 'Control médico' },
  { value: 'OTHER', label: 'Otro' },
];

/** Valida un evento reportado por el adoptante; devuelve el texto del problema o `null`. */
export function validateAdopterEvent({ eventType, date, description }, today = todayIso()) {
  if (!EVENT_OPTIONS.some((option) => option.value === eventType))
    return 'Elige el tipo de evento.';
  if (!date) return 'La fecha es obligatoria.';
  if (date > today) return 'La fecha no puede ser futura.';
  if (!description) return 'Describe lo ocurrido.';
  if (description.length > 255) return 'La descripción no puede superar los 255 caracteres.';
  return null;
}

/** Valida el enlace de una foto (http/https de hasta 255 caracteres). */
export function validatePhotoUrl(url) {
  if (!/^https?:\/\/\S+$/i.test(url ?? ''))
    return 'Escribe un enlace que empiece por http:// o https://.';
  if (url.length > 255) return 'El enlace no puede superar los 255 caracteres.';
  return null;
}

/**
 * Actualizaciones del adoptante tras la adopción: eventos médicos de su mascota, cambio de
 * dirección y nuevas fotos. El veterinario asignado ve estos cambios.
 */
export async function renderAdopterUpdatesPage(
  mount,
  { api = defaultApi, search = window.location.search } = {},
) {
  const params = new URLSearchParams(search);
  const adopterField = field({
    label: 'Adoptante',
    name: 'adopter',
    options: [{ value: '', label: 'Selecciona tu nombre' }],
  });
  const adoptionField = field({
    label: 'Mascota adoptada',
    name: 'adoption',
    options: [{ value: '', label: 'Selecciona una mascota' }],
  });
  const body = el('div', { 'aria-live': 'polite' });
  let adopter = null;

  const currentAdoption = () =>
    adopter?.adoptions?.find((item) => String(item.id) === adoptionField.control.value);

  function submitForm(fields, button, fb, task, okMessage) {
    const form = el(
      'form',
      {
        class: 'fx-form fx-form--grid',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const ok = await runTask({ button, fb }, () => task(readForm(form)));
          if (ok) {
            form.reset();
            fb.success(okMessage);
          }
        },
      },
      ...fields.map((item) => item.root),
      button,
    );
    return form;
  }

  function paintPanels() {
    const adoption = currentAdoption();
    if (!adoption) {
      renderEmpty(body, {
        title: 'Elige una mascota',
        text: 'Selecciona tu nombre y la mascota que adoptaste.',
      });
      return;
    }
    const petId = adoption.pet?.id;

    const eventFb = feedback();
    const eventForm = submitForm(
      [
        field({ label: 'Qué pasó', name: 'eventType', options: EVENT_OPTIONS }),
        field({
          label: 'Fecha',
          name: 'date',
          type: 'date',
          required: true,
          max: todayIso(),
          value: todayIso(),
        }),
        field({
          label: 'Descripción',
          name: 'description',
          rows: 2,
          required: true,
          maxlength: 255,
        }),
      ],
      el('button', { class: 'btn btn--primary', type: 'submit' }, 'Registrar evento'),
      eventFb,
      (values) => {
        const problem = validateAdopterEvent(values);
        if (problem) throw new FormError(problem);
        return api.createPetEvent(petId, values);
      },
      'Evento registrado. El veterinario asignado lo verá.',
    );

    const addressFb = feedback();
    const addressForm = submitForm(
      [
        field({
          label: 'Nueva dirección',
          name: 'address',
          required: true,
          maxlength: 255,
          value: adopter.address ?? '',
        }),
      ],
      el('button', { class: 'btn btn--primary', type: 'submit' }, 'Actualizar dirección'),
      addressFb,
      async (values) => {
        if (!values.address) throw new FormError('Escribe la dirección.');
        adopter = await api
          .updateAdopter(adopter.id, {
            name: adopter.name,
            phone: adopter.phone,
            address: values.address,
          })
          .then((saved) => ({ ...adopter, ...saved }));
      },
      'Dirección actualizada.',
    );

    const photoFb = feedback();
    const photoForm = submitForm(
      [
        field({
          label: 'Enlace de la foto',
          name: 'url',
          type: 'url',
          required: true,
          maxlength: 255,
          placeholder: 'https://…',
        }),
      ],
      el('button', { class: 'btn btn--primary', type: 'submit' }, 'Agregar foto'),
      photoFb,
      (values) => {
        const problem = validatePhotoUrl(values.url);
        if (problem) throw new FormError(problem);
        return api.addPetPhoto(petId, values.url);
      },
      'Foto agregada al perfil.',
    );

    body.setAttribute('aria-busy', 'false');
    replaceContent(
      body,
      panel(
        `Evento médico o cambio de condición de ${adoption.pet?.name ?? 'tu mascota'}`,
        eventForm,
        eventFb.node,
      ),
      panel('Cambio de dirección', addressForm, addressFb.node),
      panel('Nueva foto', photoForm, photoFb.node),
      el(
        'a',
        {
          class: 'btn btn--outline',
          href: `follow-ups.html?adoption=${encodeURIComponent(adoption.id)}&adopter=${encodeURIComponent(adopter.id)}`,
        },
        'Registrar seguimiento de adaptación',
      ),
    );
  }

  async function onAdopterChange() {
    adopter = null;
    setOptions(adoptionField.control, [], 'Selecciona una mascota');
    if (!adopterField.control.value) return paintPanels();
    try {
      adopter = await api.getAdopter(adopterField.control.value);
      const living = (adopter.adoptions ?? []).filter((item) => isLivingWithAdopter(item.status));
      setOptions(
        adoptionField.control,
        living.map((item) => ({
          value: item.id,
          label: `${item.pet?.name ?? 'Mascota'} · ${adoptionStatusLabel(item.status)}`,
        })),
        living.length ? 'Selecciona una mascota' : 'No tienes mascotas adoptadas',
      );
      if (params.get('adoption')) adoptionField.control.value = params.get('adoption');
    } catch (error) {
      renderError(body, {
        title: 'No pudimos cargar tus datos',
        text: friendlyMessage(error),
        onRetry: onAdopterChange,
      });
      return undefined;
    }
    return paintPanels();
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'ADOPTANTES'),
    el('h1', { class: 'page-title' }, 'Actualizaciones de tu mascota'),
    el(
      'p',
      { class: 'page-lead' },
      'Reporta eventos médicos, cambios de dirección y nuevas fotos.',
    ),
    el('div', { class: 'fx-toolbar' }, adopterField.root, adoptionField.root),
    body,
  );
  adopterField.control.addEventListener('change', onAdopterChange);
  adoptionField.control.addEventListener('change', paintPanels);

  try {
    const adopters = (await api.listAdopters()) ?? [];
    setOptions(
      adopterField.control,
      adopters.map((item) => ({ value: item.id, label: item.name })),
      adopters.length ? 'Selecciona tu nombre' : 'No hay adoptantes',
    );
    const adopterId = params.get('adopter') ?? sessionUserId(ROLES.ADOPTER);
    if (adopterId) {
      adopterField.control.value = adopterId;
      return onAdopterChange();
    }
  } catch (error) {
    renderError(body, { title: 'No pudimos cargar los adoptantes', text: friendlyMessage(error) });
    return undefined;
  }
  return paintPanels();
}
