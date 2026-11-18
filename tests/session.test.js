import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHeader } from '../src/js/components/header.js';
import { NAV_LINKS } from '../src/js/config.js';
import { nextUrl, renderLoginPage } from '../src/js/pages/loginPage.js';
import {
  ROLES,
  SESSION_KEY,
  canAccess,
  clearSession,
  getSession,
  guardTarget,
  sessionUserId,
  setSession,
} from '../src/js/services/session.js';
import { petPhoto, speciesImage, speciesKind, speciesLabel } from '../src/js/utils/petImage.js';
import { jsonResponse, until } from './helpers.js';

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '<header id="h"></header><div id="app"></div>';
});

const labelsFor = (role) => {
  setSession({ role, userId: 1, name: 'X' });
  const navigate = vi.fn();
  renderHeader(document.getElementById('h'), { links: NAV_LINKS, current: 'home', navigate });
  return [...document.querySelectorAll('.site-nav a')].map((a) => a.textContent);
};

describe('sesión y permisos', () => {
  it('guarda, lee y borra la sesión; ignora datos corruptos', () => {
    expect(getSession()).toBeNull();
    setSession({ role: ROLES.ADOPTER, userId: 4, name: 'Ana' });
    expect(getSession()).toEqual({ role: 'ADOPTER', userId: '4', name: 'Ana' });
    expect(sessionUserId(ROLES.ADOPTER)).toBe('4');
    expect(sessionUserId(ROLES.VETERINARIAN)).toBeNull();
    clearSession();
    expect(getSession()).toBeNull();
    window.localStorage.setItem(SESSION_KEY, '{no json');
    expect(getSession()).toBeNull();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'HACKER' }));
    expect(getSession()).toBeNull();
    expect(() => setSession({ role: 'HACKER' })).toThrow();
  });

  it('cada rol solo accede a lo suyo y el administrador a todo', () => {
    const adopter = { role: 'ADOPTER' };
    const vet = { role: 'VETERINARIAN' };
    const admin = { role: 'ADMIN' };
    expect(canAccess(adopter, 'follow-ups')).toBe(true);
    expect(canAccess(adopter, 'medical-history')).toBe(false);
    expect(canAccess(adopter, 'reports')).toBe(false);
    expect(canAccess(vet, 'medical-history')).toBe(true);
    expect(canAccess(vet, 'follow-ups')).toBe(false);
    expect(canAccess(vet, 'pet-management')).toBe(false);
    expect(canAccess(null, 'home')).toBe(false);
    expect(canAccess(vet, 'clave-desconocida')).toBe(true);
    for (const link of NAV_LINKS) expect(canAccess(admin, link.key)).toBe(true);
  });

  it('guardTarget: login sin sesión, inicio sin permiso y nada si puede entrar', () => {
    expect(guardTarget('pets', { session: null, here: 'pets.html?x=1' })).toBe(
      'login.html?next=pets.html%3Fx%3D1',
    );
    expect(guardTarget('reports', { session: { role: 'ADOPTER' } })).toBe('index.html?denied=1');
    expect(guardTarget('pets', { session: { role: 'ADOPTER' } })).toBeNull();
    expect(guardTarget(undefined, { session: null })).toBeNull();
    expect(guardTarget('login', { session: null })).toBeNull();
  });
});

describe('encabezado por rol', () => {
  it('cada rol ve un menú distinto', () => {
    const adopter = labelsFor('ADOPTER');
    expect(adopter).toContain('Seguimiento');
    expect(adopter).not.toContain('Reportes');
    const vet = labelsFor('VETERINARIAN');
    expect(vet).not.toContain('Seguimiento');
    expect(document.querySelector('.site-nav__more-list').textContent).toContain(
      'Historial médico',
    );
    const admin = labelsFor('ADMIN');
    expect(admin).toContain('Seguimiento');
    expect(document.querySelector('.site-nav__more-list').textContent).toContain('Reportes');
  });

  it('muestra rol y nombre, y «Salir» cierra la sesión y vuelve al login', () => {
    setSession({ role: 'ADOPTER', userId: 1, name: 'Ana' });
    const navigate = vi.fn();
    renderHeader(document.getElementById('h'), { links: NAV_LINKS, current: 'home', navigate });
    expect(document.querySelector('.user-chip').textContent).toContain('Adoptante');
    expect(document.querySelector('.user-chip').textContent).toContain('Ana');
    document.querySelector('.user-chip__exit').click();
    expect(getSession()).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith('login.html');
  });

  it('sin sesión redirige al login y no muestra secciones; sin permiso va al inicio', () => {
    const navigate = vi.fn();
    renderHeader(document.getElementById('h'), { links: NAV_LINKS, current: 'pets', navigate });
    expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^login\.html\?next=/));
    expect(document.querySelectorAll('.site-nav a')).toHaveLength(0);
    expect(document.querySelector('a[href="login.html"]')).not.toBeNull();

    setSession({ role: 'VETERINARIAN', userId: 1, name: 'V' });
    const denied = vi.fn();
    renderHeader(document.getElementById('h'), {
      links: NAV_LINKS,
      current: 'reports',
      navigate: denied,
    });
    expect(denied).toHaveBeenCalledWith('index.html?denied=1');
  });
});

describe('página de ingreso', () => {
  const stubApi = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).endsWith('/adopters')) return jsonResponse([{ id: 2, name: 'Ana' }]);
        if (String(url).endsWith('/administrators')) return jsonResponse([]);
        if (String(url).endsWith('/shelters')) return jsonResponse([{ id: 1, name: 'Huellas' }]);
        return jsonResponse([{ id: 9, name: 'Dr. Paz' }]);
      }),
    );

  it('ofrece los tres roles y, al elegir el adoptante, guarda la sesión y redirige', async () => {
    stubApi();
    const navigate = vi.fn();
    renderLoginPage(document.getElementById('app'), { search: '?next=follow-ups.html', navigate });
    expect(document.querySelectorAll('.role-card')).toHaveLength(3);
    document.querySelector('[data-role="ADOPTER"]').click();
    await until(() => document.querySelector('select[name="identity"] option[value="2"]'));
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(document.querySelector('.fx-feedback--error').textContent).toMatch(/Selecciona/);
    document.querySelector('select').value = '2';
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(getSession()).toEqual({ role: 'ADOPTER', userId: '2', name: 'Ana' });
    expect(navigate).toHaveBeenCalledWith('follow-ups.html');
    vi.unstubAllGlobals();
  });

  it('el veterinario se elige entre los de los refugios y el administrador puede ser general', async () => {
    stubApi();
    const navigate = vi.fn();
    renderLoginPage(document.getElementById('app'), { navigate });
    document.querySelector('[data-role="VETERINARIAN"]').click();
    await until(() => document.querySelector('select option[value="9"]'));
    document.querySelector('select').value = '9';
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(getSession()).toEqual({ role: 'VETERINARIAN', userId: '9', name: 'Dr. Paz' });
    expect(navigate).toHaveBeenCalledWith('index.html');

    renderLoginPage(document.getElementById('app'), { navigate });
    document.querySelector('[data-role="ADMIN"]').click();
    await until(() => document.querySelector('select'));
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(getSession()).toMatchObject({
      role: 'ADMIN',
      userId: null,
      name: 'Administrador general',
    });
    vi.unstubAllGlobals();
  });

  it('«Cambiar rol» vuelve a los roles y el destino solo admite páginas del sitio', async () => {
    stubApi();
    renderLoginPage(document.getElementById('app'), { navigate: vi.fn() });
    document.querySelector('[data-role="ADMIN"]').click();
    document.querySelector('.back-link--button').click();
    expect(document.querySelectorAll('.role-card')).toHaveLength(3);
    expect(nextUrl('?next=https://evil.test/x')).toBe('index.html');
    expect(nextUrl('?next=login.html')).toBe('index.html');
    expect(nextUrl('?next=pets.html%3Fa%3D1')).toBe('pets.html?a=1');
    vi.unstubAllGlobals();
  });

  it('avisa si no hay usuarios del rol elegido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([])),
    );
    renderLoginPage(document.getElementById('app'), { navigate: vi.fn() });
    document.querySelector('[data-role="ADOPTER"]').click();
    await until(() => document.querySelector('.state__title'));
    expect(document.querySelector('.state__title').textContent).toMatch(/No hay adoptantes/);
    vi.unstubAllGlobals();
  });
});

describe('imagen y tipo de mascota', () => {
  it('reconoce la especie y usa su ilustración cuando no hay foto', () => {
    expect(speciesKind('Perro')).toBe('dog');
    expect(speciesKind(' GATO ')).toBe('cat');
    expect(speciesKind('Conejo')).toBe('other');
    expect(speciesKind(undefined)).toBe('other');
    expect(speciesImage('Felino')).toMatch(/pet-cat\.svg$/);
    expect(speciesLabel('Perro')).toBe('🐶 Perro');
    expect(speciesLabel('')).toBe('');
    expect(petPhoto({ species: 'Gato', photos: [] })).toMatch(/pet-cat/);
    expect(petPhoto({ species: 'Gato', photos: ['https://x.test/a.jpg'] })).toBe(
      'https://x.test/a.jpg',
    );
    expect(petPhoto(undefined)).toMatch(/pet-other/);
  });
});
