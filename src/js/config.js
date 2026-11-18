export const APP_NAME = 'Refugio Huellas';

export const API_BASE_URL = '/api';

export const REQUEST_TIMEOUT_MS = 10000;

/** Navegación principal compartida por todas las páginas. */
export const NAV_LINKS = [
  { key: 'home', href: 'index.html', label: 'Inicio' },
  { key: 'pets', href: 'pets.html', label: 'Mascotas' },
  { key: 'available', href: 'disponibles.html', label: 'Disponibles' },
  { key: 'requirements', href: 'requirements.html', label: 'Requisitos' },
  { key: 'shelters', href: 'shelters.html', label: 'Refugios' },
  { key: 'requests', href: 'solicitudes.html', label: 'Solicitudes' },
  { key: 'follow-ups', href: 'follow-ups.html', label: 'Seguimiento' },
  { key: 'calendar', href: 'calendario.html', label: 'Calendario' },
  { key: 'messages', href: 'mensajes.html', label: 'Mensajes', group: 'more' },
  { key: 'stories', href: 'historias.html', label: 'Reseñas e historias', group: 'more' },
  { key: 'adopter-updates', href: 'actualizaciones.html', label: 'Mi mascota', group: 'more' },
  { key: 'veterinarians', href: 'veterinarios.html', label: 'Veterinarios', group: 'more' },
  {
    key: 'medical-history',
    href: 'medical-history.html',
    label: 'Historial médico',
    group: 'more',
  },
  {
    key: 'vet-adoptions',
    href: 'veterinario-adopciones.html',
    label: 'Adopciones asignadas',
    group: 'more',
  },
  { key: 'reports', href: 'reportes.html', label: 'Reportes', group: 'more' },
  { key: 'notifications', href: 'notifications.html', label: 'Notificaciones', group: 'more' },
  { key: 'administrators', href: 'administradores.html', label: 'Administradores', group: 'more' },
  {
    key: 'pet-management',
    href: 'pet-management.html',
    label: 'Gestión de mascotas',
    group: 'more',
  },
];
