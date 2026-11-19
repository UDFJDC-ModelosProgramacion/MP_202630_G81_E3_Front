export const ADOPTION_STATUS_LABELS = {
  PENDING: 'Solicitud pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  ACTIVE: 'Activa',
  IN_PROGRESS: 'En proceso',
  COHABITATION: 'En convivencia de prueba',
  COMPLETED: 'Adopción completada',
  RETURNED: 'Devuelta',
  CANCELLED: 'Cancelada',
};

export function adoptionStatusLabel(status) {
  return ADOPTION_STATUS_LABELS[status] ?? status ?? 'Sin estado';
}

export function adoptionStatusKind(status) {
  if (['COMPLETED', 'ACTIVE', 'APPROVED'].includes(status)) return 'success';
  if (['PENDING', 'IN_PROGRESS', 'COHABITATION'].includes(status)) return 'warning';
  return 'neutral';
}

export const LIVING_WITH_ADOPTER = [
  'APPROVED',
  'ACTIVE',
  'IN_PROGRESS',
  'COHABITATION',
  'COMPLETED',
];

export const isLivingWithAdopter = (status) => LIVING_WITH_ADOPTER.includes(status);
