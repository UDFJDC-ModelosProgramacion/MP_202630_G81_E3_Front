import { listShelters } from '../api/sheltersApi.js';
import * as petManagementApi from '../api/petManagementApi.js';
import { showAlert } from '../components/alert.js';
import { renderHeader } from '../components/header.js';
import { createPetManagementForm } from '../components/petManagementForm.js';
import { renderPetManagementList } from '../components/petManagementList.js';
import { renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import {
  petToValues,
  sortPetsByName,
  toCreatePayload,
  toUpdatePayload,
} from '../domain/petManagement.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const defaultApi = { ...petManagementApi, listShelters };

/**
 * Página de gestión de mascotas: listado (nombre, estado y acciones) y formulario para
 * registrar o actualizar. Devuelve la promesa de la carga inicial para poder esperarla en tests.
 */
export async function initPetManagementPage(document_ = document, { api = defaultApi } = {}) {
  const app = document_.getElementById('app');
  if (!app) return;

  const header = document_.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'pet-management' });

  let pets = [];
  let shelters = [];
  let editing = null;

  const feedback = el('div', { 'aria-live': 'polite' });
  const formTitle = el('h2', { class: 'h5 card-title mb-3' });
  const formMount = el('div');
  const listMount = el('div', { 'aria-live': 'polite' });

  clear(app).append(
    el('h1', { class: 'page-title' }, 'Gestión de mascotas'),
    el(
      'p',
      { class: 'page-lead' },
      'Registra y actualiza los datos de las mascotas disponibles para adopción.',
    ),
    feedback,
    el(
      'div',
      { class: 'row g-4' },
      el(
        'section',
        { class: 'col-xl-5', 'aria-labelledby': 'pet-form-heading' },
        el(
          'div',
          { class: 'card' },
          el('div', { class: 'card-body' }, formTitle, formMount),
        ),
      ),
      el(
        'section',
        { class: 'col-xl-7', 'aria-labelledby': 'pet-list-heading' },
        el('h2', { class: 'h5 mb-3', id: 'pet-list-heading' }, 'Mascotas registradas'),
        listMount,
      ),
    ),
  );
  formTitle.id = 'pet-form-heading';

  function paintList() {
    renderPetManagementList(listMount, sortPetsByName(pets), {
      onEdit: startEditing,
      editingId: editing?.id ?? null,
    });
  }

  function paintForm() {
    const isNew = editing === null;
    formTitle.textContent = isNew ? 'Registrar mascota' : `Editar a ${editing.name}`;
    const form = createPetManagementForm({
      shelters,
      isNew,
      values: isNew ? undefined : petToValues(editing),
      onSubmit: isNew ? register : (values) => update(values),
      onCancel: isNew ? undefined : stopEditing,
    });
    clear(formMount).append(form.element);
  }

  function startEditing(pet) {
    editing = pet;
    clear(feedback);
    paintForm();
    paintList();
    formMount.querySelector('input, select')?.focus();
  }

  function stopEditing() {
    editing = null;
    paintForm();
    paintList();
  }

  async function register(values) {
    const created = await api.createPet(toCreatePayload(values));
    await reloadPets();
    showAlert(feedback, {
      kind: 'success',
      message: `La mascota ${created?.name ?? values.name} fue registrada correctamente.`,
    });
  }

  async function update(values) {
    const target = editing;
    const saved = await api.updatePet(target.id, toUpdatePayload(values, target));
    editing = null;
    await reloadPets();
    paintForm();
    showAlert(feedback, {
      kind: 'success',
      message: `Los datos de ${saved?.name ?? values.name} se actualizaron correctamente.`,
    });
  }

  async function reloadPets() {
    pets = await api.listPets();
    paintList();
  }

  async function load() {
    renderLoading(listMount, 'Cargando mascotas…');
    try {
      [pets, shelters] = await Promise.all([api.listPets(), api.listShelters()]);
      paintForm();
      paintList();
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar las mascotas',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  return load();
}
