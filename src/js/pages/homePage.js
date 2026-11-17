import { getAvailablePets } from '../api/petsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { el } from '../utils/dom.js';

/** Accesos rápidos a las secciones del sitio. */
export const HOME_SECTIONS = [
  {
    href: 'disponibles.html',
    title: 'Mascotas disponibles',
    text: 'Filtra por espacio y nivel de actividad y encuentra a tu compañero ideal.',
  },
  {
    href: 'pets.html',
    title: 'Conoce a las mascotas',
    text: 'Explora a todas las mascotas del refugio, su raza y su historia.',
  },
  {
    href: 'shelters.html',
    title: 'Refugios',
    text: 'Encuentra un refugio por ciudad y conoce a su equipo y sus eventos.',
  },
  {
    href: 'requirements.html',
    title: 'Requisitos para adoptar',
    text: 'Revisa qué necesitas y comprueba si estás listo para empezar.',
  },
  {
    href: 'follow-ups.html',
    title: 'Seguimiento',
    text: 'Cuéntanos cómo va la adaptación de tu mascota después de adoptarla.',
  },
  {
    href: 'administradores.html',
    title: 'Administradores',
    text: 'Registra administradores y asócialos a los refugios que gestionan.',
  },
  {
    href: 'pet-management.html',
    title: 'Gestión de mascotas',
    text: 'Registra nuevas mascotas y actualiza los datos de las existentes.',
  },
  {
    href: 'medical-history.html',
    title: 'Historial médico',
    text: 'Los veterinarios consultan la atención de las mascotas a su cargo.',
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

/** Cifras reales del back; si no responde, la sección simplemente no se muestra. */
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

/** Página de inicio: presentación, cifras del refugio, accesos y pasos para adoptar. */
export function renderHome(app, { api = { getAvailablePets, listShelters } } = {}) {
  const stats = el('div', { class: 'home-stats', hidden: true, 'aria-live': 'polite' });

  app.replaceChildren(
    el(
      'section',
      { class: 'home-hero', 'aria-labelledby': 'home-title' },
      el('p', { class: 'home-hero__eyebrow' }, 'Refugio Huellas'),
      el('h1', { class: 'home-hero__title', id: 'home-title' }, 'Cada huella merece un hogar'),
      el(
        'p',
        { class: 'home-hero__lead' },
        'Conoce a las mascotas que esperan una familia, revisa lo que necesitas para adoptar y acompaña su adaptación.',
      ),
      el(
        'div',
        { class: 'home-hero__actions' },
        el(
          'a',
          { class: 'btn btn--primary', href: 'disponibles.html' },
          'Ver mascotas disponibles',
        ),
        el(
          'a',
          { class: 'btn btn--outline', href: 'requirements.html' },
          'Requisitos para adoptar',
        ),
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
        ...HOME_SECTIONS.map((section) =>
          el(
            'li',
            {},
            el(
              'a',
              { class: 'home-card', href: section.href },
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
