import * as vetApi from '../api/veterinarianAdoptionsApi.js';
import { ROLES, sessionUserId } from '../services/session.js';
import { listShelters } from '../api/sheltersApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { adoptionStatusKind, adoptionStatusLabel } from '../domain/adoptionStatus.js';
import { eventTypeLabel } from '../domain/petEvents.js';
import { el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { formatDate } from '../utils/format.js';
import { field, panel, replaceContent, setOptions, tag } from '../utils/ui.js';

const list = (items, build, emptyText) =>
  items.length
    ? el('ul', { class: 'fx-list' }, ...items.map(build))
    : el('p', { class: 'fx-item__meta' }, emptyText);

export async function renderVetAdoptionsPage(
  mount,
  { api = vetApi, fetchShelters = listShelters, search = window.location.search } = {},
) {
  const params = new URLSearchParams(search);
  const vet = field({
    label: 'Veterinario',
    name: 'veterinarian',
    options: [{ value: '', label: 'Selecciona un veterinario' }],
  });
  const body = el('div', { 'aria-live': 'polite' });

  async function showDetail(adoption, target) {
    renderLoading(target, 'Cargando seguimiento…');
    try {
      const [followUps, events] = await Promise.all([
        api.listAssignedFollowUps(vet.control.value, adoption.id),
        api.listAssignedPetEvents(vet.control.value, adoption.id),
      ]);
      target.setAttribute('aria-busy', 'false');
      replaceContent(
        target,
        el('h3', {}, 'Seguimientos del adoptante'),
        list(
          followUps ?? [],
          (item) =>
            el(
              'li',
              { class: 'fx-item' },
              el(
                'div',
                {},
                el(
                  'p',
                  { class: 'fx-item__title' },
                  `${formatDate(item.date)} · ${item.adaptationStatus}`,
                ),
                el('p', { class: 'fx-item__meta' }, item.observations),
              ),
            ),
          'Aún no hay seguimientos.',
        ),
        el('h3', {}, 'Eventos de la mascota'),
        list(
          events ?? [],
          (item) =>
            el(
              'li',
              { class: 'fx-item' },
              el(
                'div',
                {},
                el(
                  'p',
                  { class: 'fx-item__title' },
                  `${formatDate(item.date)} · ${eventTypeLabel(item.eventType)}`,
                ),
                el('p', { class: 'fx-item__meta' }, item.description ?? ''),
              ),
            ),
          'Aún no hay eventos.',
        ),
      );
    } catch (error) {
      renderError(target, {
        title: error.status === 403 ? 'Sin autorización' : 'No pudimos cargar el seguimiento',
        text:
          error.status === 403
            ? 'Esta adopción no está asignada a este veterinario.'
            : friendlyMessage(error),
        onRetry: () => showDetail(adoption, target),
      });
    }
  }

  function adoptionItem(adoption) {
    const detail = el('div');
    return el(
      'li',
      { class: 'fx-item' },
      el(
        'div',
        {},
        el(
          'p',
          { class: 'fx-item__title' },
          `${adoption.pet?.name ?? 'Mascota'} · ${adoption.adopter?.name ?? 'Adoptante'}`,
        ),
        el(
          'p',
          { class: 'fx-item__meta' },
          tag(adoptionStatusLabel(adoption.status), adoptionStatusKind(adoption.status)),
          ` ${adoption.adopter?.phone ?? ''} ${adoption.adopter?.address ? `· ${adoption.adopter.address}` : ''}`,
        ),
        detail,
      ),
      el(
        'button',
        { class: 'btn btn--outline', type: 'button', onClick: () => showDetail(adoption, detail) },
        'Ver seguimiento y eventos',
      ),
    );
  }

  async function load() {
    if (!vet.control.value) {
      renderEmpty(body, {
        title: 'Elige un veterinario',
        text: 'Verás las adopciones que tiene asignadas.',
      });
      return;
    }
    renderLoading(body, 'Cargando adopciones…');
    try {
      const adoptions = (await api.listAssignedAdoptions(vet.control.value)) ?? [];
      body.setAttribute('aria-busy', 'false');
      if (!adoptions.length) {
        renderEmpty(body, {
          title: 'Sin adopciones asignadas',
          text: 'El refugio te asignará adopciones para el seguimiento.',
        });
        return;
      }
      replaceContent(
        body,
        panel(
          'Adopciones asignadas',
          el('ul', { class: 'fx-list' }, ...adoptions.map(adoptionItem)),
        ),
      );
    } catch (error) {
      renderError(body, {
        title: 'No pudimos cargar las adopciones',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'VETERINARIA'),
    el('h1', { class: 'page-title' }, 'Adopciones asignadas'),
    el(
      'p',
      { class: 'page-lead' },
      'Controles periódicos, vacunas y problemas médicos posadopción.',
    ),
    el('div', { class: 'fx-toolbar' }, vet.root),
    body,
  );
  vet.control.addEventListener('change', load);

  try {
    const shelters = (await fetchShelters()) ?? [];
    const vets = shelters.flatMap((shelter) =>
      (shelter.veterinarians ?? []).map((item) => ({
        value: item.id,
        label: `${item.name} · ${shelter.name}`,
      })),
    );
    setOptions(
      vet.control,
      vets,
      vets.length ? 'Selecciona un veterinario' : 'No hay veterinarios',
    );
    const vetId = params.get('veterinarian') ?? sessionUserId(ROLES.VETERINARIAN);
    if (vetId) vet.control.value = vetId;
  } catch (error) {
    renderError(body, {
      title: 'No pudimos cargar los veterinarios',
      text: friendlyMessage(error),
    });
    return undefined;
  }
  return load();
}
