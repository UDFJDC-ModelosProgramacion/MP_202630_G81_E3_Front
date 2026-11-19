import * as coexistenceApi from '../api/coexistenceApi.js';
import { getAdoption } from '../api/adoptionsApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { adoptionStatusKind, adoptionStatusLabel } from '../domain/adoptionStatus.js';
import { addDaysIso, toInputDate } from '../utils/dates.js';
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
  tag,
  todayIso,
} from '../utils/ui.js';

export const TRIAL_DAYS = 14;

export const RESULT_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'SUCCESSFUL', label: 'Exitosa: la adopción continúa' },
  { value: 'UNSUCCESSFUL', label: 'No exitosa: se devuelve la mascota' },
];

const resultLabel = (value) =>
  RESULT_OPTIONS.find((option) => option.value === value)?.label ?? value;

export function validatePeriod({ startDate, endDate }) {
  if (!startDate) return 'La fecha de inicio es obligatoria.';
  if (!endDate) return 'La fecha de fin es obligatoria.';
  if (endDate < startDate) return 'La fecha de fin no puede ser anterior al inicio.';
  return null;
}

export async function renderCoexistencePage(
  mount,
  adoptionId,
  { api = coexistenceApi, fetchAdoption = getAdoption } = {},
) {
  const summary = el('div');
  const body = el('div', { 'aria-live': 'polite' });

  const devolutionLink = el(
    'a',
    {
      class: 'btn btn--outline',
      href: `devolution.html?adoption=${encodeURIComponent(adoptionId)}`,
    },
    'Registrar devolución',
  );

  function startForm() {
    const start = field({
      label: 'Inicio',
      name: 'startDate',
      type: 'date',
      required: true,
      value: todayIso(),
    });
    const end = field({
      label: 'Fin del periodo',
      name: 'endDate',
      type: 'date',
      required: true,
      value: addDaysIso(todayIso(), TRIAL_DAYS),
    });
    const fb = feedback();
    const submit = el(
      'button',
      { class: 'btn btn--primary', type: 'submit' },
      'Iniciar convivencia',
    );
    const form = el(
      'form',
      {
        class: 'fx-form fx-form--grid',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const values = readForm(form);
          const problem = validatePeriod(values);
          if (problem) return fb.error(problem);
          const ok = await runTask({ button: submit, fb }, () =>
            api.createCoexistenceTest(adoptionId, { ...values, result: 'IN_PROGRESS' }),
          );
          if (ok) await load();
          return undefined;
        },
      },
      start.root,
      end.root,
      submit,
    );
    return panel(
      'Iniciar convivencia de prueba',
      el('p', { class: 'fx-item__meta' }, 'Define el periodo acordado con el adoptante.'),
      form,
      fb.node,
    );
  }

  function detail(test) {
    const result = field({
      label: 'Resultado',
      name: 'result',
      value: test.result,
      options: RESULT_OPTIONS,
    });
    const fb = feedback();
    const submit = el('button', { class: 'btn btn--primary', type: 'submit' }, 'Guardar resultado');
    const form = el(
      'form',
      {
        class: 'fx-form fx-form--grid',
        novalidate: true,
        onSubmit: async (event) => {
          event.preventDefault();
          const { result: value } = readForm(form);
          const ok = await runTask({ button: submit, fb }, () =>
            api.updateCoexistenceTest(adoptionId, {
              startDate: toInputDate(test.startDate),
              endDate: toInputDate(test.endDate),
              result: value,
            }),
          );
          if (ok) await load();
        },
      },
      result.root,
      submit,
    );
    const remove = el(
      'button',
      {
        class: 'btn btn--outline',
        type: 'button',
        onClick: async () => {
          try {
            await api.deleteCoexistenceTest(adoptionId);
            await load();
          } catch (error) {
            fb.error(friendlyMessage(error));
          }
        },
      },
      'Cancelar convivencia',
    );
    return panel(
      'Convivencia de prueba',
      el(
        'p',
        {},
        `Del ${formatDate(test.startDate)} al ${formatDate(test.endDate)} · `,
        tag(resultLabel(test.result), test.result === 'SUCCESSFUL' ? 'success' : 'warning'),
      ),
      form,
      fb.node,
      el(
        'div',
        { class: 'fx-actions' },
        test.result === 'UNSUCCESSFUL' ? devolutionLink : null,
        remove,
      ),
    );
  }

  async function load() {
    renderLoading(body, 'Cargando convivencia…');
    try {
      const adoption = await fetchAdoption(adoptionId);
      replaceContent(
        summary,
        el(
          'p',
          {},
          `${adoption.pet?.name ?? 'Mascota'} · ${adoption.adopter?.name ?? 'Adoptante'} · `,
          tag(adoptionStatusLabel(adoption.status), adoptionStatusKind(adoption.status)),
        ),
      );
      const test = await api.getCoexistenceTest(adoptionId).catch((error) => {
        if (error.status === 404) return null;
        throw error;
      });
      body.setAttribute('aria-busy', 'false');
      replaceContent(body, test ? detail(test) : startForm());
    } catch (error) {
      replaceContent(summary);
      if (error.status === 404) {
        renderEmpty(body, {
          title: 'Adopción no encontrada',
          text: 'Vuelve a la lista de solicitudes.',
        });
        return;
      }
      renderError(body, {
        title: 'No pudimos cargar la convivencia',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  replaceContent(
    mount,
    el('p', { class: 'eyebrow' }, 'ADOPCIÓN'),
    el('h1', { class: 'page-title' }, 'Convivencia de prueba'),
    el(
      'p',
      { class: 'page-lead' },
      'Un periodo de prueba para comprobar la adaptación antes de cerrar la adopción.',
    ),
    summary,
    body,
    el('a', { class: 'btn btn--outline', href: 'solicitudes.html' }, 'Volver a solicitudes'),
  );
  return load();
}
