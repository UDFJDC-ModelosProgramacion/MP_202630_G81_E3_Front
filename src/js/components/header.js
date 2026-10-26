import { APP_NAME } from '../config.js';
import { el, clear } from '../utils/dom.js';

const DEFAULT_LINKS = [{ key: 'home', href: 'index.html', label: 'Inicio' }];

export function renderHeader(mount, { links = DEFAULT_LINKS, current } = {}) {
  const brand = el(
    'a',
    { class: 'brand', href: 'index.html' },
    el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, APP_NAME.charAt(0)),
    el('span', { class: 'brand__name' }, APP_NAME),
  );

  const nav = el(
    'nav',
    { class: 'site-nav', 'aria-label': 'Principal' },
    ...links.map((link) =>
      el(
        'a',
        {
          class: 'site-nav__link',
          href: link.href,
          'aria-current': link.key === current ? 'page' : false,
        },
        link.label,
      ),
    ),
  );

  clear(mount).append(el('div', { class: 'container site-header__inner' }, brand, nav));
  return mount;
}
