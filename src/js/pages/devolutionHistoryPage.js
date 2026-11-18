import * as devolutionApi from '../api/devolutionApi.js';
import { renderDevolutionHistoryList } from '../components/devolutionHistoryList.js';
import { renderHeader } from '../components/header.js';
import { renderError, renderLoading } from '../components/stateViews.js';
import { NAV_LINKS } from '../config.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

/**
 * Página `devolution-history.html`: historial de devoluciones de todas las adopciones.
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export async function initDevolutionHistoryPage(doc = document, { api = devolutionApi } = {}) {
  const app = doc.getElementById('app');
  if (!app) return;

  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS, current: 'devolutions' });

  const listMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Historial de devoluciones'),
    el(
      'p',
      { class: 'page-lead' },
      'Mascotas que volvieron al refugio, con la fecha y el motivo de cada devolución.',
    ),
    listMount,
  );

  async function load() {
    renderLoading(listMount, 'Cargando devoluciones…');
    try {
      const devolutions = await api.listDevolutions();
      renderDevolutionHistoryList(listMount, Array.isArray(devolutions) ? devolutions : []);
    } catch (error) {
      renderError(listMount, {
        title: 'No pudimos cargar las devoluciones',
        text: friendlyMessage(error),
        onRetry: load,
      });
    }
  }

  await load();
}