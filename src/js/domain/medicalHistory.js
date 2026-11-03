/** Texto en minúsculas y sin tildes, para comparar búsquedas. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Mascotas que coinciden con lo escrito: el nombre contiene el texto (sin distinguir
 * mayúsculas ni tildes) o el identificador empieza por él. Sin texto devuelve todas.
 */
export function matchPets(pets = [], query = '') {
  const text = normalizeText(query);
  if (!text) return pets;
  return pets.filter(
    (pet) => normalizeText(pet.name).includes(text) || String(pet.id).startsWith(text),
  );
}

/** Registros médicos del más reciente al más antiguo (empata por id). No modifica el arreglo. */
export function sortMedicalRecords(records = []) {
  return [...records].sort(
    (a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')) ||
      Number(b.id ?? 0) - Number(a.id ?? 0),
  );
}

/** Datos clínicos de un registro, en orden de lectura; solo los que están disponibles. */
export function availableMedicalFields(record) {
  return [
    { key: 'reason', label: 'Motivo de consulta', value: record.reason },
    { key: 'diagnosis', label: 'Diagnóstico', value: record.diagnosis },
    { key: 'treatment', label: 'Tratamiento', value: record.treatment },
  ].filter((field) => String(field.value ?? '').trim() !== '');
}
