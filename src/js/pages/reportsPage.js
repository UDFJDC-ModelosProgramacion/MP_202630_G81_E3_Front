import * as reportsApi from '../api/reportsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { shelterField } from '../components/shelterPicker.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { adoptionStatusLabel } from '../domain/adoptionStatus.js';
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

/** Barras proporcionales para un conteo por categoría (`{ categoría: n }`). */
export function barList(counts = {}, labelOf = (key) => key) {
  const entries = Object.entries(counts);
  if (!entries.length) return el('p', { class: 'fx-item__meta' }, 'Sin datos en el periodo.');
  const max = Math.max(...entries.map(([, value]) => value));
  return el(
    'ul',
    { class: 'fx-bars' },
    ...entries.map(([key, value]) =>
      el(
        'li',
        { class: 'fx-bar' },
        el('span', {}, labelOf(key)),
        el(
          'span',
          { class: 'fx-bar__track' },
          el('span', { class: 'fx-bar__fill', style: `width:${Math.round((value / max) * 100)}%` }),
        ),
        el('strong', {}, String(value)),
      ),
    ),
  );
}

const stat = (label, value) =>
  el(
    'div',
    { class: 'fx-stat' },
    el('span', { class: 'fx-stat__value' }, String(value)),
    el('span', {}, label),
  );

/** Reportes de adopciones, devoluciones y eventos médicos de un refugio. */
export async function renderReportsPage(
  mount,
  { api = reportsApi, fetchShelters = listShelters, search = window.location.search } = {},
) {
  const params = new URLSearchParams(search);
  const shelter = shelterField([], params.get('shelter') ?? '');
  const from = field({ label: 'Desde (opcional)', name: 'from', type: 'date' });
  const to = field({ label: 'Hasta (opcional)', name: 'to', type: 'date' });
  const fb = feedback();
  const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, 'Generar reporte');
  const result = el('div', { 'aria-live': 'polite' });

  function paint(report) {
    result.setAttribute('aria-busy', 'false');
    replaceContent(
      result,
      panel(
        `Inventario de ${report.shelterName}`,
        el(
          'div',
          { class: 'fx-stats' },
          stat('Mascotas', report.totalPets),
          stat('Disponibles', report.availablePets),
          stat('En proceso', report.inProcessPets),
          stat('Adoptadas', report.adoptedPets),
        ),
      ),
      panel(
        `Adopciones (${report.totalAdoptions})`,
        barList(report.adoptionsByStatus, adoptionStatusLabel),
      ),
      panel(`Devoluciones (${report.totalReturns})`, barList(report.returnsByReason)),
      panel(
        `Eventos médicos y de vida (${report.totalPetEvents})`,
        el('p', { class: 'fx-item__meta' }, `Registros médicos: ${report.totalMedicalRecords}`),
        barList(report.petEventsByType),
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
        if (!values.shelter) return fb.error('Selecciona un refugio.');
        if (values.from && values.to && values.to < values.from)
          return fb.error('La fecha final no puede ser anterior a la inicial.');
        renderLoading(result, 'Generando reporte…');
        const ok = await runTask({ button: submit, fb, pendingLabel: 'Generando…' }, async () => {
          paint(await api.getShelterReport(values.shelter, { from: values.from, to: values.to }));
        });
        if (!ok) replaceContent(result);
        return undefined;
      },
    },
    shelter.root,
    from.root,
    to.root,
    submit,
  );

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'GESTIÓN'),
    el('h1', { class: 'page-title' }, 'Reportes del refugio'),
    el('p', { class: 'page-lead' }, 'Estadísticas de adopciones, devoluciones y eventos médicos.'),
    panel(null, form, fb.node),
    result,
  );
  renderEmpty(result, {
    title: 'Elige un refugio',
    text: 'Selecciona un refugio y genera el reporte.',
  });

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
    renderError(result, { title: 'No pudimos cargar los refugios', text: friendlyMessage(error) });
  }
  return undefined;
}
