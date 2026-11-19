export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

export function matchPets(pets = [], query = '') {
  const text = normalizeText(query);
  if (!text) return pets;
  return pets.filter(
    (pet) => normalizeText(pet.name).includes(text) || String(pet.id).startsWith(text),
  );
}

export function sortMedicalRecords(records = []) {
  return [...records].sort(
    (a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')) ||
      Number(b.id ?? 0) - Number(a.id ?? 0),
  );
}

export function availableMedicalFields(record) {
  return [
    { key: 'reason', label: 'Motivo de consulta', value: record.reason },
    { key: 'diagnosis', label: 'Diagnóstico', value: record.diagnosis },
    { key: 'treatment', label: 'Tratamiento', value: record.treatment },
  ].filter((field) => String(field.value ?? '').trim() !== '');
}
