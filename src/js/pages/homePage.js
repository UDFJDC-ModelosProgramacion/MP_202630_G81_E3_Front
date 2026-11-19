import { getAvailablePets } from '../api/petsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { ROLE_LABELS, canAccess, getSession } from '../services/session.js';
import { el } from '../utils/dom.js';

export const HOME_SECTIONS = [
  {
    href: 'disponibles.html',
    key: 'available',
    icon: '🐕',
    title: 'Mascotas disponibles',
    text: 'Filtra por espacio y nivel de actividad y encuentra a tu compañero ideal.',
  },
  {
    href: 'pets.html',
    key: 'pets',
    icon: '🐾',
    title: 'Conoce a las mascotas',
    text: 'Explora a todas las mascotas del refugio, su raza y su historia.',
  },
  {
    href: 'shelters.html',
    key: 'shelters',
    icon: '🏠',
    title: 'Refugios',
    text: 'Encuentra un refugio por ciudad y conoce a su equipo y sus eventos.',
  },
  {
    href: 'requirements.html',
    key: 'requirements',
    icon: '📋',
    title: 'Requisitos para adoptar',
    text: 'Revisa qué necesitas y comprueba si estás listo para empezar.',
  },
  {
    href: 'follow-ups.html',
    key: 'follow-ups',
    icon: '💬',
    title: 'Seguimiento',
    text: 'Cuéntanos cómo va la adaptación de tu mascota después de adoptarla.',
  },
  {
    href: 'administradores.html',
    key: 'administrators',
    icon: '🧑‍💼',
    title: 'Administradores',
    text: 'Registra administradores y asócialos a los refugios que gestionan.',
  },
  {
    href: 'pet-management.html',
    key: 'pet-management',
    icon: '✏️',
    title: 'Gestión de mascotas',
    text: 'Registra nuevas mascotas y actualiza los datos de las existentes.',
  },
  {
    href: 'medical-history.html',
    key: 'medical-history',
    icon: '🩺',
    title: 'Historial médico',
    text: 'Los veterinarios consultan la atención de las mascotas a su cargo.',
  },
  {
    href: 'veterinario-adopciones.html',
    key: 'vet-adoptions',
    icon: '💉',
    title: 'Adopciones asignadas',
    text: 'Seguimientos y novedades de las adopciones que tienes a tu cargo.',
  },
  {
    href: 'solicitudes.html',
    key: 'requests',
    icon: '📨',
    title: 'Solicitudes de adopción',
    text: 'Solicita adoptar, aprueba solicitudes y gestiona la convivencia de prueba.',
  },
  {
    href: 'calendario.html',
    key: 'calendar',
    icon: '📅',
    title: 'Calendario',
    text: 'Ferias de adopción, talleres y jornadas de vacunación de cada refugio.',
  },
  {
    href: 'mensajes.html',
    key: 'messages',
    icon: '✉️',
    title: 'Mensajes',
    text: 'Escribe al refugio para resolver dudas o coordinar una visita.',
  },
  {
    href: 'actualizaciones.html',
    key: 'adopter-updates',
    icon: '📷',
    title: 'Mi mascota adoptada',
    text: 'Reporta eventos médicos, cambios de dirección y nuevas fotos.',
  },
  {
    href: 'historias.html',
    key: 'stories',
    icon: '⭐',
    title: 'Reseñas e historias de éxito',
    text: 'Conoce la experiencia de quienes ya adoptaron.',
  },
  {
    href: 'reportes.html',
    key: 'reports',
    icon: '📊',
    title: 'Reportes',
    text: 'Estadísticas de adopciones, devoluciones y eventos médicos por refugio.',
  },
];

const STEPS = [
  ['Explora', 'Mira las mascotas disponibles y elige la que se ajusta a tu hogar.'],
  ['Cumple los requisitos', 'Verifica que puedes ofrecerle espacio, tiempo y cuidados.'],
  ['Adopta', 'Revisa el contrato y completa el proceso con el refugio.'],
  ['Acompáñala', 'Registra su adaptación con seguimientos periódicos.'],
];

function statItem(value, label) {
  return el(
    'div',
    { class: 'home-stat' },
    el('strong', { class: 'home-stat__value' }, String(value)),
    el('span', { class: 'home-stat__label' }, label),
  );
}

async function renderStats(mount, api) {
  try {
    const [pets, shelters] = await Promise.all([api.getAvailablePets(), api.listShelters()]);
    if (!Array.isArray(pets) || !Array.isArray(shelters)) return;
    mount.replaceChildren(
      statItem(pets.length, pets.length === 1 ? 'mascota disponible' : 'mascotas disponibles'),
      statItem(shelters.length, shelters.length === 1 ? 'refugio' : 'refugios'),
    );
    mount.hidden = false;
  } catch {
    mount.hidden = true;
  }
}

export function renderHome(app, { api = { getAvailablePets, listShelters } } = {}) {
  const stats = el('div', { class: 'home-stats', hidden: true, 'aria-live': 'polite' });
  const session = getSession();
  const canSee = (key) => !session || canAccess(session, key);
  const sections = HOME_SECTIONS.filter((section) => canSee(section.key));
  const denied = new URLSearchParams(window.location.search).has('denied');

  app.replaceChildren(
    el(
      'section',
      { class: 'home-hero', 'aria-labelledby': 'home-title' },
      el('img', { class: 'home-hero__art', src: 'assets/images/hero.svg', alt: '' }),
      denied
        ? el(
            'p',
            { class: 'fx-feedback fx-feedback--error', role: 'alert' },
            'Tu rol no tiene acceso a esa sección.',
          )
        : null,
      el(
        'p',
        { class: 'home-hero__eyebrow' },
        session
          ? `${ROLE_LABELS[session.role]}${session.name ? ` · ${session.name}` : ''}`
          : 'Refugio Huellas',
      ),
      el('h1', { class: 'home-hero__title', id: 'home-title' }, 'Cada huella merece un hogar'),
      el(
        'p',
        { class: 'home-hero__lead' },
        'Conoce a las mascotas que esperan una familia, revisa lo que necesitas para adoptar y acompaña su adaptación.',
      ),
      el(
        'div',
        { class: 'home-hero__actions' },
        canSee('available')
          ? el(
              'a',
              { class: 'btn btn--primary', href: 'disponibles.html' },
              'Ver mascotas disponibles',
            )
          : el('a', { class: 'btn btn--primary', href: 'pets.html' }, 'Conocer a las mascotas'),
        canSee('requirements')
          ? el(
              'a',
              { class: 'btn btn--outline', href: 'requirements.html' },
              'Requisitos para adoptar',
            )
          : null,
      ),
      stats,
    ),
    el(
      'section',
      { class: 'home-block', 'aria-labelledby': 'home-sections' },
      el('h2', { class: 'home-block__title', id: 'home-sections' }, '¿Qué quieres hacer?'),
      el(
        'ul',
        { class: 'home-cards' },
        ...sections.map((section) =>
          el(
            'li',
            {},
            el(
              'a',
              { class: 'home-card', href: section.href },
              el('span', { class: 'home-card__icon', 'aria-hidden': 'true' }, section.icon ?? '🐾'),
              el('h3', { class: 'home-card__title' }, section.title),
              el('p', { class: 'home-card__text' }, section.text),
            ),
          ),
        ),
      ),
    ),
    el(
      'section',
      { class: 'home-block', 'aria-labelledby': 'home-steps' },
      el('h2', { class: 'home-block__title', id: 'home-steps' }, 'Adoptar paso a paso'),
      el(
        'ol',
        { class: 'home-steps' },
        ...STEPS.map(([title, text]) =>
          el(
            'li',
            { class: 'home-step' },
            el('h3', { class: 'home-step__title' }, title),
            el('p', { class: 'home-step__text' }, text),
          ),
        ),
      ),
    ),
  );

  return renderStats(stats, api);
}
