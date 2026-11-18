/** Imagen y etiqueta de especie de una mascota (con ilustración cuando no hay foto). */
const IMAGES = {
  dog: 'assets/images/pet-dog.svg',
  cat: 'assets/images/pet-cat.svg',
  other: 'assets/images/pet-other.svg',
};
const ICONS = { dog: '🐶', cat: '🐱', other: '🐾' };

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** `dog`, `cat` u `other` según el texto libre de la especie. */
export function speciesKind(species) {
  const text = normalize(species);
  if (/^(perr|dog|canin)/.test(text)) return 'dog';
  if (/^(gat|cat|felin)/.test(text)) return 'cat';
  return 'other';
}

export const speciesImage = (species) => IMAGES[speciesKind(species)];
export const speciesIcon = (species) => ICONS[speciesKind(species)];

/** Texto de la especie con su ícono, p. ej. «🐶 Perro»; vacío si no se conoce. */
export function speciesLabel(species) {
  const text = String(species ?? '').trim();
  return text ? `${speciesIcon(text)} ${text}` : '';
}

/** Foto de la mascota si existe; si no, la ilustración de su especie. */
export function petPhoto(pet) {
  const first = Array.isArray(pet?.photos)
    ? pet.photos.find((url) => typeof url === 'string' && url)
    : null;
  return first || speciesImage(pet?.species);
}
