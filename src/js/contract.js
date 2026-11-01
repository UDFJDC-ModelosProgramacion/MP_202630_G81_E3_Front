import { getAdoptionContract, getContract } from './api/contractsApi.js';
import { renderContract } from './components/contractView.js';
import { renderHeader } from './components/header.js';
import { renderEmpty, renderError, renderLoading } from './components/stateViews.js';
import { NAV_LINKS } from './config.js';
import { clear, el, getQueryParam } from './utils/dom.js';
import { friendlyMessage } from './utils/errors.js';

const isValidId = (value) => /^\d+$/.test(String(value));

/** Elige cómo consultar el contrato según la URL; `null` si no hay un id válido. */
function resolveSource(search) {
  const contractId = getQueryParam('contract', search);
  if (isValidId(contractId)) return () => getContract(contractId);

  const adoptionId = getQueryParam('adoption', search);
  if (isValidId(adoptionId)) return () => getAdoptionContract(adoptionId);

  return null;
}

/**
 * Punto de entrada de la página del contrato
 * (`contract.html?contract=<id>` o `contract.html?adoption=<id>`).
 * Devuelve la promesa de la carga inicial para poder esperarla en los tests.
 */
export function init(doc = document, search = window.location.search) {
  const header = doc.getElementById('site-header');
  if (header) renderHeader(header, { links: NAV_LINKS });

  const app = doc.getElementById('app');
  if (!app) return Promise.resolve();

  const fetchContract = resolveSource(search);
  if (!fetchContract) {
    renderEmpty(app, {
      title: 'Falta el contrato',
      text: 'Abre esta página desde una adopción o un contrato para revisar sus condiciones.',
    });
    return Promise.resolve();
  }

  const contractMount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el('h1', { class: 'page-title' }, 'Contrato de adopción'),
    el(
      'p',
      { class: 'page-lead' },
      'Revisa la fecha y las condiciones que aceptas al adoptar a una mascota.',
    ),
    contractMount,
  );

  async function loadContract() {
    renderLoading(contractMount, 'Cargando contrato…');
    try {
      const contract = await fetchContract();
      if (contract) {
        renderContract(contractMount, contract);
      } else {
        renderEmpty(contractMount, {
          title: 'Esta adopción aún no tiene contrato',
          text: 'Cuando el refugio registre el contrato, podrás revisarlo aquí.',
        });
      }
    } catch (error) {
      renderError(contractMount, {
        title: 'No pudimos cargar el contrato',
        text: friendlyMessage(error),
        onRetry: loadContract,
      });
    }
  }

  return loadContract();
}

init();
