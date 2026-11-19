import * as vaccinationsApi from '../api/vaccinationsApi.js';
import { getPet } from '../api/petManagementApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { upcomingVaccinations, validateVaccination } from '../domain/vaccinations.js';
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
  todayIso,
} from '../utils/ui.js';

const vaccinationItem = (vaccination, onDelete) =>
  el(
    'li',
    { class: 'fx-item' },
    el(
      'div',
      {},
      el('p', { class: 'fx-item__title' }, vaccination.name),
      el(
        'p',
        { class: 'fx-item__meta' },
        `Aplicada: ${formatDate(vaccination.applicationDate)}`,
        vaccination.nextDueDate ? ` · Próxima dosis: ${formatDate(vaccination.nextDueDate)}` : '',
        vaccination.veterinarian?.name ? ` · ${vaccination.veterinarian.name}` : '',
      ),
      vaccination.notes ? el('p', { class: 'fx-item__meta' }, vaccination.notes) : null,
    ),
    onDelete
      ? el('button', { class: 'btn btn--outline', type: 'button', onClick: onDelete }, 'Eliminar')
      : null,
  );

export async function renderVaccinationsPage(
  mount,
  petId,
  { api = vaccinationsApi, fetchPet = getPet } = {},
) {
  const title = el('h1', { class: 'page-title' }, 'Carné de vacunación');
  const upcomingMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });

  const name = field({ label: 'Vacuna', name: 'name', required: true, maxlength: 255 });
  const applied = field({
    label: 'Fecha de aplicación',
    name: 'applicationDate',
    type: 'date',
    required: true,
    max: todayIso(),
  });
  const next = field({ label: 'Próxima dosis (opcional)', name: 'nextDueDate', type: 'date' });
  const notes = field({ label: 'Notas (opcional)', name: 'notes', maxlength: 255 });
  const fb = feedback();
  const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, 'Registrar vacuna');

  async function load() {
    renderLoading(listMount, 'Cargando carné…');
    try {
      const vaccinations = await api.listVaccinations(petId);
      paint(Array.isArray(vaccinations) ? vaccinations : []);
    } catch (error) {
      replaceContent(upcomingMount);
      if (error.status === 404) {
        renderEmpty(listMount, {
          title: 'Mascota no encontrada',
          text: 'Vuelve al listado de mascotas.',
        });
        return;
      }
      renderError(listMount, {
        title: 'No pudimos cargar el carné',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  function paint(vaccinations) {
    const upcoming = upcomingVaccinations(vaccinations);
    replaceContent(
      upcomingMount,
      panel(
        'Próximas dosis',
        upcoming.length
          ? el('ul', { class: 'fx-list' }, ...upcoming.map((item) => vaccinationItem(item)))
          : el('p', { class: 'fx-item__meta' }, 'No hay dosis programadas.'),
      ),
    );
    listMount.setAttribute('aria-busy', 'false');
    replaceContent(
      listMount,
      panel(
        'Vacunas aplicadas',
        vaccinations.length
          ? el(
              'ul',
              { class: 'fx-list' },
              ...vaccinations.map((item) =>
                vaccinationItem(item, async () => {
                  try {
                    await api.deleteVaccination(petId, item.id);
                    await load();
                  } catch (error) {
                    fb.error(friendlyMessage(error));
                  }
                }),
              ),
            )
          : el('p', { class: 'fx-item__meta' }, 'Aún no hay vacunas registradas.'),
      ),
    );
  }

  const form = el(
    'form',
    {
      class: 'fx-form fx-form--grid',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();
        const values = readForm(form);
        const errors = validateVaccination(values);
        const [firstError] = Object.values(errors);
        if (firstError) {
          fb.error(firstError);
          return;
        }
        const saved = await runTask({ button: submit, fb, pendingLabel: 'Guardando…' }, () =>
          api.createVaccination(petId, {
            name: values.name,
            applicationDate: values.applicationDate,
            nextDueDate: values.nextDueDate || null,
            notes: values.notes || null,
          }),
        );
        if (saved) {
          form.reset();
          fb.success('Vacuna registrada.');
          await load();
        }
      },
    },
    name.root,
    applied.root,
    next.root,
    notes.root,
    submit,
  );

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'MASCOTA'),
    title,
    el('p', { class: 'page-lead' }, 'Vacunas aplicadas y fechas de las próximas dosis.'),
    upcomingMount,
    listMount,
    panel('Registrar vacuna', form, fb.node),
    el('a', { class: 'btn btn--outline', href: 'pets.html' }, 'Volver a mascotas'),
  );

  fetchPet(petId)
    .then((pet) => {
      if (pet?.name) title.textContent = `Carné de vacunación de ${pet.name}`;
    })
    .catch(() => {});
  return load();
}
