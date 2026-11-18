import { APP_NAME } from '../config.js';
import { el, clear } from '../utils/dom.js';
import {
  ROLE_LABELS,
  clearSession,
  filterLinksByRole,
  getSession,
  guardTarget,
  LOGIN_PAGE,
} from '../services/session.js';

const DEFAULT_LINKS = [{ key: 'home', href: 'index.html', label: 'Inicio' }];

function navLink(link, current) {
  return el(
    'a',
    {
      class: 'site-nav__link',
      href: link.href,
      'aria-current': link.key === current ? 'page' : false,
    },
    link.label,
  );
}

/** Los enlaces con `group: 'more'` van dentro del desplegable «Más». */
function moreMenu(links, current) {
  if (links.length === 0) return null;
  return el(
    'details',
    { class: 'site-nav__more', open: links.some((link) => link.key === current) },
    el('summary', { class: 'site-nav__link' }, 'Más'),
    el('div', { class: 'site-nav__more-list' }, ...links.map((link) => navLink(link, current))),
  );
}

function userBox(session, navigate) {
  if (!session)
    return el('a', { class: 'btn btn--outline btn--small', href: LOGIN_PAGE }, 'Ingresar');
  return el(
    'div',
    { class: 'user-chip' },
    el(
      'span',
      { class: `user-chip__role user-chip__role--${session.role.toLowerCase()}` },
      ROLE_LABELS[session.role],
    ),
    session.name ? el('span', { class: 'user-chip__name' }, session.name) : null,
    el(
      'button',
      {
        class: 'user-chip__exit',
        type: 'button',
        onClick: () => {
          clearSession();
          navigate(LOGIN_PAGE);
        },
      },
      'Salir',
    ),
  );
}

const goTo = (url) => window.location.assign(url);

/**
 * Encabezado común: muestra solo las secciones permitidas al rol de la sesión y envía al login
 * a quien no ha ingresado (o al inicio si su rol no puede ver la página actual).
 */
export function renderHeader(mount, { links = DEFAULT_LINKS, current, navigate = goTo } = {}) {
  const session = getSession();
  const target = guardTarget(current, { session });
  if (target) navigate(target);

  const brand = el(
    'a',
    { class: 'brand', href: 'index.html' },
    el('img', { class: 'brand__logo', src: 'assets/images/logo.svg', alt: '' }),
    el('span', { class: 'brand__name' }, APP_NAME),
  );

  const visible = session ? filterLinksByRole(links, session) : [];
  const main = visible.filter((link) => link.group !== 'more');
  const more = visible.filter((link) => link.group === 'more');

  const nav = el(
    'nav',
    { class: 'site-nav', 'aria-label': 'Principal' },
    ...main.map((link) => navLink(link, current)),
    moreMenu(more, current),
  );

  clear(mount).append(
    el('div', { class: 'container site-header__inner' }, brand, nav, userBox(session, navigate)),
  );
  return mount;
}
