import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { ROLES, ROLE_LABELS, setSession } from '../services/session.js';
import {
  administratorOptions,
  adopterOptions,
  veterinarianOptions,
} from '../services/directory.js';
import { clear, el } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { field } from '../utils/ui.js';

const goTo = (url) => window.location.assign(url);

export const ROLE_INFO = {
  [ROLES.ADOPTER]: {
    image: 'assets/images/role-adopter.svg',
    text: 'Busca mascotas, solicita adoptar y haz su seguimiento.',
    who: 'Adoptante',
    load: adopterOptions,
    emptyText: 'Aún no hay adoptantes registrados.',
  },
  [ROLES.VETERINARIAN]: {
    image: 'assets/images/role-veterinarian.svg',
    text: 'Consulta el historial médico y las adopciones que tienes asignadas.',
    who: 'Veterinario',
    load: veterinarianOptions,
    emptyText: 'Aún no hay veterinarios registrados; un administrador debe crearlos.',
  },
  [ROLES.ADMIN]: {
    image: 'assets/images/role-admin.svg',
    text: 'Gestiona refugios, mascotas, veterinarios, solicitudes y reportes.',
    who: 'Administrador',
    load: administratorOptions,
    general: 'Administrador general',
  },
};

function roleCard(role, onPick) {
  const info = ROLE_INFO[role];
  return el(
    'button',
    { class: 'role-card', type: 'button', 'data-role': role, onClick: () => onPick(role) },
    el('img', { class: 'role-card__image', src: info.image, alt: '' }),
    el('span', { class: 'role-card__title' }, ROLE_LABELS[role]),
    el('span', { class: 'role-card__text' }, info.text),
  );
}

export function nextUrl(search) {
  const next = new URLSearchParams(search).get('next');
  return next && /^[\w-]+\.html(\?.*)?$/.test(next) && !next.startsWith('login')
    ? next
    : 'index.html';
}

async function showIdentity(app, role, { navigate, search, back }) {
  const info = ROLE_INFO[role];
  const mount = el('div', { 'aria-live': 'polite' });
  clear(app).append(
    el(
      'button',
      { class: 'back-link back-link--button', type: 'button', onClick: back },
      '← Cambiar rol',
    ),
    el('h1', { class: 'page-title' }, `Ingresar como ${ROLE_LABELS[role].toLowerCase()}`),
    mount,
  );

  async function load() {
    renderLoading(mount, 'Cargando usuarios…');
    let options;
    try {
      options = await info.load();
    } catch (error) {
      renderError(mount, {
        title: 'No pudimos cargar los usuarios',
        text: friendlyMessage(error),
        onRetry: load,
      });
      return;
    }
    const all = info.general ? [{ value: '', label: info.general }, ...options] : options;
    if (all.length === 0) {
      renderEmpty(mount, { title: `No hay ${info.who.toLowerCase()}s`, text: info.emptyText });
      return;
    }
    const select = field({
      label: `¿Quién eres?`,
      name: 'identity',
      required: true,
      options: info.general ? all : [{ value: '', label: 'Selecciona tu nombre' }, ...all],
    });
    const error = el('p', { class: 'fx-feedback fx-feedback--error', role: 'alert' });
    clear(mount).append(
      el(
        'form',
        {
          class: 'fx-form login-form',
          onSubmit: (event) => {
            event.preventDefault();
            const value = select.control.value;
            const chosen = all.find((option) => option.value === value);
            if (!chosen || (!value && !info.general)) {
              error.textContent = 'Selecciona quién eres para continuar.';
              return;
            }
            setSession({ role, userId: value || null, name: chosen.label.split(' · ')[0] });
            navigate(nextUrl(search));
          },
        },
        select.root,
        error,
        el('button', { class: 'btn btn--primary', type: 'submit' }, 'Ingresar'),
        info.register
          ? el('a', { class: 'login-form__link', href: info.register.href }, info.register.label)
          : null,
      ),
    );
  }
  return load();
}

export function renderLoginPage(app, { search = window.location.search, navigate = goTo } = {}) {
  function showRoles() {
    clear(app).append(
      el(
        'section',
        { class: 'login' },
        el('img', { class: 'login__logo', src: 'assets/images/logo.svg', alt: '' }),
        el('h1', { class: 'page-title' }, 'Bienvenido a Refugio Huellas'),
        el(
          'p',
          { class: 'page-lead' },
          'Elige cómo quieres ingresar para ver las opciones que te corresponden.',
        ),
        el(
          'div',
          { class: 'role-grid' },
          ...Object.values(ROLES).map((role) =>
            roleCard(role, (picked) =>
              showIdentity(app, picked, { navigate, search, back: showRoles }),
            ),
          ),
        ),
      ),
    );
    return Promise.resolve();
  }
  return showRoles();
}
