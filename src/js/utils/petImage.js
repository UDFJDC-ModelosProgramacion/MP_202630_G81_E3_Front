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

export function speciesKind(species) {
  const text = normalize(species);
  if (/^(perr|dog|canin)/.test(text)) return 'dog';
  if (/^(gat|cat|felin)/.test(text)) return 'cat';
  return 'other';
}

export const speciesImage = (species) => IMAGES[speciesKind(species)];
export const speciesIcon = (species) => ICONS[speciesKind(species)];

export function speciesLabel(species) {
  const text = String(species ?? '').trim();
  return text ? `${speciesIcon(text)} ${text}` : '';
}

export function petPhoto(pet) {
  const first = Array.isArray(pet?.photos)
    ? pet.photos.find((url) => typeof url === 'string' && url)
    : null;
  return first || speciesImage(pet?.species);
}
