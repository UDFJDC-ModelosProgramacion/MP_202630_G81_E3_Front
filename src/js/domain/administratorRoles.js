export const ADMINISTRATOR_ROLES = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'COORDINATOR', label: 'Coordinador' },
];

export function roleLabel(role) {
  return ADMINISTRATOR_ROLES.find((option) => option.value === role)?.label ?? role;
}
