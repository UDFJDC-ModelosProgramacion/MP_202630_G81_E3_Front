export const NO_PET_NAME = 'Mascota sin nombre';
export const NO_ADOPTER_NAME = 'Adoptante sin nombre';

export const petNameOf = (devolution) => devolution.adoption?.pet?.name || NO_PET_NAME;

export const adopterNameOf = (devolution) =>
  devolution.adoption?.adopter?.name || NO_ADOPTER_NAME;

/** Devoluciones de la más reciente a la más antigua (empata por id). No modifica el arreglo. */
export function sortDevolutions(devolutions = []) {
  return [...devolutions].sort(
    (a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')) ||
      Number(b.id ?? 0) - Number(a.id ?? 0),
  );
}