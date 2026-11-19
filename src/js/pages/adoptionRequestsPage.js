import { listAdopters } from '../api/adoptersApi.js';
import * as adoptionsApi from '../api/adoptionsApi.js';
import { getAvailablePets } from '../api/petsApi.js';
import { listShelterVeterinarians } from '../api/veterinariansApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import {
  adoptionStatusKind,
  adoptionStatusLabel,
  isLivingWithAdopter,
} from '../domain/adoptionStatus.js';
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

const defaultApi = {
  ...adoptionsApi,
  listAdopters,
  getAvailablePets,
  listShelterVeterinarians,
};

const query = (key, id) => `?${key}=${encodeURIComponent(id)}`;

export async function renderAdoptionRequestsPage(mount, { api = defaultApi } = {}) {
  const formMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });

  async function changeStatus(adoption, status, fb) {
    try {
      await api.updateAdoptionStatus(adoption.id, { adoptionDate: adoption.adoptionDate, status });
      await load();
    } catch (error) {
      fb.error(friendlyMessage(error));
    }
  }

  function veterinarianAssigner(adoption) {
    const shelterId = adoption.pet?.shelter?.id;
    if (!shelterId) return null;
    const select = el('select', {
      class: 'fx-control',
      'aria-label': 'Veterinario de seguimiento',
    });
    const fb = feedback();
    const save = el(
      'button',
      {
        class: 'btn btn--outline',
        type: 'button',
        onClick: async () => {
          if (!select.value) return fb.error('Elige un veterinario.');
          const ok = await runTask({ button: save, fb }, () =>
            api.assignVeterinarian(adoption.id, select.value),
          );
          if (ok) await load();
          return undefined;
        },
      },
      'Asignar',
    );
    const details = el(
      'details',
      {},
      el(
        'summary',
        {},
        adoption.veterinarian
          ? `Veterinario: ${adoption.veterinarian.name}`
          : 'Asignar veterinario',
      ),
      el('div', { class: 'fx-actions' }, select, save),
      fb.node,
    );
    details.addEventListener(
      'toggle',
      async () => {
        try {
          const vets = await api.listShelterVeterinarians(shelterId);
          setOptions(
            select,
            (vets ?? []).map((vet) => ({
              value: vet.id,
              label: `${vet.name} · ${vet.speciality}`,
            })),
            vets?.length ? 'Selecciona un veterinario' : 'Este refugio no tiene veterinarios',
          );
          if (adoption.veterinarian) select.value = String(adoption.veterinarian.id);
        } catch (error) {
          fb.error(friendlyMessage(error));
        }
      },
      { once: true },
    );
    return details;
  }

  function adoptionItem(adoption) {
    const fb = feedback();
    const actions = [];
    if (adoption.status === 'PENDING') {
      actions.push(
        el(
          'button',
          {
            class: 'btn btn--primary',
            type: 'button',
            onClick: () => changeStatus(adoption, 'APPROVED', fb),
          },
          'Aprobar',
        ),
        el(
          'button',
          {
            class: 'btn btn--outline',
            type: 'button',
            onClick: () => changeStatus(adoption, 'REJECTED', fb),
          },
          'Rechazar',
        ),
      );
    }
    if (isLivingWithAdopter(adoption.status)) {
      actions.push(
        el(
          'a',
          { class: 'btn btn--outline', href: `convivencia.html${query('adoption', adoption.id)}` },
          'Convivencia de prueba',
        ),
        el(
          'a',
          { class: 'btn btn--outline', href: `follow-ups.html${query('adoption', adoption.id)}` },
          'Seguimiento',
        ),
        el(
          'a',
          { class: 'btn btn--outline', href: `devolution.html${query('adoption', adoption.id)}` },
          'Devolución',
        ),
      );
    }
    if (adoption.status === 'APPROVED') {
      actions.push(
        el(
          'button',
          {
            class: 'btn btn--outline',
            type: 'button',
            onClick: () => changeStatus(adoption, 'COMPLETED', fb),
          },
          'Completar adopción',
        ),
      );
    }
    return el(
      'li',
      { class: 'fx-item' },
      el(
        'div',
        {},
        el(
          'p',
          { class: 'fx-item__title' },
          `${adoption.pet?.name ?? 'Mascota'} → ${adoption.adopter?.name ?? 'Adoptante'}`,
        ),
        el(
          'p',
          { class: 'fx-item__meta' },
          `Solicitud del ${formatDate(adoption.adoptionDate)} `,
          tag(adoptionStatusLabel(adoption.status), adoptionStatusKind(adoption.status)),
        ),
        isLivingWithAdopter(adoption.status) ? veterinarianAssigner(adoption) : null,
        fb.node,
      ),
      el('div', { class: 'fx-actions' }, ...actions),
    );
  }

  function requestForm(adopters, pets) {
    const adopter = field({
      label: 'Adoptante',
      name: 'adopterId',
      required: true,
      options: [
        { value: '', label: adopters.length ? 'Selecciona un adoptante' : 'No hay adoptantes' },
        ...adopters.map((item) => ({ value: item.id, label: item.name })),
      ],
    });
    const pet = field({
      label: 'Mascota disponible',
      name: 'petId',
      required: true,
      options: [
        {
          value: '',
          label: pets.length ? 'Selecciona una mascota' : 'No hay mascotas disponibles',
        },
        ...pets.map((item) => ({ value: item.id, label: item.name })),
      ],
    });
    const date = field({
      label: 'Fecha',
      name: 'adoptionDate',
      type: 'date',
      required: true,
      value: todayIso(),
    });
    const fb = feedback();
    const submit = el(
      'button',
      { class: 'btn btn--primary', type: 'submit' },
      'Registrar solicitud',
    );
    const form = el(
      'form',
      {
        class: 'fx-form fx-form--grid',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const values = readForm(form);
          if (!values.adopterId || !values.petId || !values.adoptionDate) {
            return fb.error('Elige adoptante, mascota y fecha.');
          }
          const ok = await runTask({ button: submit, fb }, () =>
            api.createAdoption({
              adoptionDate: values.adoptionDate,
              status: 'PENDING',
              adopter: { id: Number(values.adopterId) },
              pet: { id: Number(values.petId) },
            }),
          );
          if (ok) {
            await load();
            fb.success('Solicitud registrada.');
          }
          return undefined;
        },
      },
      adopter.root,
      pet.root,
      date.root,
      submit,
    );
    return panel('Nueva solicitud de adopción', form, fb.node);
  }

  async function load() {
    renderLoading(listMount, 'Cargando solicitudes…');
    try {
      const [adoptions, adopters, pets] = await Promise.all([
        api.listAdoptions(),
        api.listAdopters(),
        api.getAvailablePets(),
      ]);
      replaceContent(formMount, requestForm(adopters ?? [], pets ?? []));
      listMount.setAttribute('aria-busy', 'false');
      if (!adoptions?.length) {
        renderEmpty(listMount, {
          title: 'Aún no hay solicitudes',
          text: 'Cuando alguien solicite adoptar una mascota aparecerá aquí.',
        });
        return;
      }
      replaceContent(
        listMount,
        panel(
          'Solicitudes y adopciones',
          el('ul', { class: 'fx-list' }, ...adoptions.map(adoptionItem)),
        ),
      );
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar las solicitudes',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'ADOPCIONES'),
    el('h1', { class: 'page-title' }, 'Solicitudes de adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Registra solicitudes, apruébalas, asigna al veterinario de seguimiento y gestiona la convivencia de prueba.',
    ),
    formMount,
    listMount,
  );
  return load();
}
