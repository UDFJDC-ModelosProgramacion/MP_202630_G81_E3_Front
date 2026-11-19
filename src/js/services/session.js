export const ROLES = Object.freeze({
  ADOPTER: 'ADOPTER',
  VETERINARIAN: 'VETERINARIAN',
  ADMIN: 'ADMIN',
});

export const ROLE_LABELS = Object.freeze({
  ADOPTER: 'Adoptante',
  VETERINARIAN: 'Veterinario',
  ADMIN: 'Administrador',
});

const ALL = [ROLES.ADOPTER, ROLES.VETERINARIAN, ROLES.ADMIN];
const { ADOPTER, VETERINARIAN, ADMIN } = ROLES;

export const ACCESS = Object.freeze({
  home: ALL,
  pets: ALL,
  available: [ADOPTER, ADMIN],
  requirements: [ADOPTER, ADMIN],
  shelters: ALL,
  requests: [ADOPTER, ADMIN],
  'follow-ups': [ADOPTER, ADMIN],
  calendar: ALL,
  messages: [ADOPTER, ADMIN],
  stories: ALL,
  'adopter-updates': [ADOPTER, ADMIN],
  veterinarians: [ADMIN],
  'medical-history': [VETERINARIAN, ADMIN],
  'vet-adoptions': [VETERINARIAN, ADMIN],
  reports: [ADMIN],
  notifications: ALL,
  administrators: [ADMIN],
  'pet-management': [ADMIN],
});

export const SESSION_KEY = 'huellas.session';
export const LOGIN_PAGE = 'login.html';

export function getSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    return session && ALL.includes(session.role) ? session : null;
  } catch {
    return null;
  }
}

export function setSession({ role, userId = null, name = '' }) {
  if (!ALL.includes(role)) throw new Error('Rol no válido.');
  const session = { role, userId: userId === null ? null : String(userId), name };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // nada que guardar
  }
  return session;
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nada que borrar */
  }
}

export function canAccess(session, key) {
  if (!session) return false;
  if (!key || !(key in ACCESS)) return true;
  return ACCESS[key].includes(session.role);
}

export const filterLinksByRole = (links, session) =>
  links.filter((link) => canAccess(session, link.key));

export function sessionUserId(role, session = getSession()) {
  return session?.role === role && session.userId ? session.userId : null;
}

export function guardTarget(key, { session = getSession(), here = currentPage() } = {}) {
  if (!key || key === 'login') return null;
  if (!session) return `${LOGIN_PAGE}?next=${encodeURIComponent(here)}`;
  return canAccess(session, key) ? null : 'index.html?denied=1';
}

export function currentPage() {
  const { pathname, search } = window.location;
  return `${pathname.split('/').pop() || 'index.html'}${search}`;
}
