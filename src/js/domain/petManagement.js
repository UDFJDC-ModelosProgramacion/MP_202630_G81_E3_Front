import { SEX_OPTIONS, SIZE_OPTIONS } from './petFilters.js';
import { todayIso } from './followUps.js';

export { SEX_OPTIONS, SIZE_OPTIONS };

/** Estados de una mascota (valor enviado al back → etiqueta). */
export const PET_STATUSES = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_PROCESS', label: 'En proceso de adopción' },
  { value: 'ADOPTED', label: 'Adoptada' },
];

export const ACTIVITY_LEVELS = ['Baja', 'Media', 'Alta'];
export const SPACE_REQUIREMENTS = ['Poco', 'Moderado', 'Amplio'];

export const MAX_NAME_LENGTH = 100;
export const MAX_TEXT_LENGTH = 255;
export const MAX_AGE = 40;
export const ARRIVAL_EVENT_TYPE = 'ARRIVAL';

/** Imagen de la mascota: tipos y tamaño permitidos al subir un archivo. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_URL_LENGTH = 255;

/** `true` si es un enlace http/https de hasta 255 caracteres (lo que acepta el back). */
export function isImageUrl(value) {
  const text = String(value ?? '').trim();
  return /^https?:\/\/\S+$/i.test(text) && text.length <= MAX_IMAGE_URL_LENGTH;
}

/** Valida un archivo de imagen elegido; devuelve el problema o `null`. */
export function validateImageFile(file) {
  if (!file) return 'Elige una imagen.';
  if (!IMAGE_TYPES.includes(file.type))
    return 'El archivo debe ser una imagen JPG, PNG, WEBP o GIF.';
  if (file.size > IMAGE_MAX_BYTES) return 'La imagen no puede pesar más de 5 MB.';
  return null;
}

export function petStatusLabel(value) {
  return PET_STATUSES.find((status) => status.value === value)?.label ?? value ?? 'Sin estado';
}

/** Valores iniciales del formulario para una mascota nueva. */
export function emptyPetValues(today = todayIso()) {
  return {
    name: '',
    species: '',
    status: 'AVAILABLE',
    age: '',
    sex: '',
    size: '',
    temperament: '',
    description: '',
    specialNeeds: '',
    activityLevel: '',
    spaceRequirement: '',
    compatibleWithChildren: false,
    compatibleWithOtherPets: false,
    shelterId: '',
    arrivalDate: today,
    arrivalDescription: '',
    imageUrl: '',
  };
}

/** Primera foto (la principal) de una mascota; vacío si no tiene. */
export const firstPhoto = (pet) =>
  (Array.isArray(pet?.photos) ? pet.photos.find((url) => typeof url === 'string' && url) : '') ?? '';

/** Valores del formulario a partir de una mascota que devuelve el back. */
export function petToValues(pet) {
  return {
    ...emptyPetValues(),
    name: pet.name ?? '',
    species: pet.species ?? '',
    status: pet.status ?? 'AVAILABLE',
    age: pet.age ?? '',
    sex: pet.sex ?? '',
    size: pet.size ?? '',
    temperament: pet.temperament ?? '',
    description: pet.description ?? '',
    specialNeeds: pet.specialNeeds ?? '',
    activityLevel: pet.activityLevel ?? '',
    spaceRequirement: pet.spaceRequirement ?? '',
    compatibleWithChildren: pet.compatibleWithChildren === true,
    compatibleWithOtherPets: pet.compatibleWithOtherPets === true,
    shelterId: pet.shelter?.id ?? '',
    imageUrl: firstPhoto(pet),
  };
}

const isBlank = (value) => String(value ?? '').trim() === '';
const inOptions = (value, options) => options.some((option) => option.value === value);

function validateDate(value, today) {
  const text = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!text) return 'La fecha de llegada es obligatoria.';
  if (!match) return 'La fecha de llegada no es válida.';
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real) return 'La fecha de llegada no es válida.';
  return text > today ? 'La fecha de llegada no puede ser futura.' : null;
}

/**
 * Valida el formulario. Devuelve `{ campo: mensaje }` solo con lo que falta o está mal.
 * Los datos de llegada solo se exigen al registrar (`isNew`): el back crea la mascota con un
 * único evento ARRIVAL y no permite cambiarlo al actualizar.
 */
export function validatePetValues(values, { isNew = true, today = todayIso() } = {}) {
  const errors = {};
  if (isBlank(values.name)) errors.name = 'El nombre es obligatorio.';
  else if (String(values.name).trim().length > MAX_NAME_LENGTH)
    errors.name = `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`;

  if (isBlank(values.species)) errors.species = 'La especie es obligatoria (perro, gato…).';
  else if (String(values.species).trim().length > MAX_NAME_LENGTH)
    errors.species = `La especie no puede superar los ${MAX_NAME_LENGTH} caracteres.`;

  if (!inOptions(values.status, PET_STATUSES)) errors.status = 'Elige el estado.';
  if (!inOptions(values.sex, SEX_OPTIONS)) errors.sex = 'Elige el sexo.';
  if (!inOptions(values.size, SIZE_OPTIONS)) errors.size = 'Elige el tamaño.';

  const age = Number(values.age);
  if (isBlank(values.age)) errors.age = 'La edad es obligatoria.';
  else if (!Number.isInteger(age) || age < 0 || age > MAX_AGE)
    errors.age = `La edad debe ser un número entero entre 0 y ${MAX_AGE}.`;

  if (!/^\d+$/.test(String(values.shelterId ?? ''))) errors.shelterId = 'Elige el refugio.';

  for (const field of ['temperament', 'description', 'specialNeeds']) {
    if (String(values[field] ?? '').length > MAX_TEXT_LENGTH)
      errors[field] = `No puede superar los ${MAX_TEXT_LENGTH} caracteres.`;
  }

  if (!isBlank(values.imageUrl) && !isImageUrl(values.imageUrl))
    errors.imageUrl =
      'Escribe un enlace que empiece por http:// o https:// (máximo 255 caracteres).';

  if (isNew) {
    const dateError = validateDate(values.arrivalDate, today);
    if (dateError) errors.arrivalDate = dateError;
    if (isBlank(values.arrivalDescription))
      errors.arrivalDescription = 'La descripción de la llegada es obligatoria.';
    else if (String(values.arrivalDescription).trim().length > MAX_TEXT_LENGTH)
      errors.arrivalDescription = `No puede superar los ${MAX_TEXT_LENGTH} caracteres.`;
  }
  return errors;
}

function basePayload(values) {
  const text = (value) => String(value ?? '').trim();
  return {
    name: text(values.name),
    species: text(values.species),
    status: values.status,
    age: Number(values.age),
    sex: values.sex,
    size: values.size,
    temperament: text(values.temperament),
    description: text(values.description),
    specialNeeds: text(values.specialNeeds),
    activityLevel: values.activityLevel || null,
    spaceRequirement: values.spaceRequirement || null,
    compatibleWithChildren: values.compatibleWithChildren === true,
    compatibleWithOtherPets: values.compatibleWithOtherPets === true,
    shelter: { id: Number(values.shelterId) },
  };
}

/** Cuerpo de `POST /pets`: la mascota con su único evento de llegada. */
export function toCreatePayload(values) {
  return {
    ...basePayload(values),
    events: [
      {
        eventType: ARRIVAL_EVENT_TYPE,
        date: String(values.arrivalDate).trim(),
        description: String(values.arrivalDescription).trim(),
      },
    ],
  };
}

/**
 * Cuerpo de `PUT /pets/{id}`. El back reemplaza la mascota completa, por eso se conservan las
 * fotos actuales y siempre se envía el refugio (es obligatorio en la base de datos).
 * La imagen del formulario es la foto principal: reemplaza a la primera y conserva las demás;
 * si se deja vacía, se quita la principal.
 */
export function toUpdatePayload(values, existing = {}) {
  const current = existing.photos ?? [];
  if (values.imageUrl === undefined) return { ...basePayload(values), photos: current };
  const image = String(values.imageUrl).trim();
  const rest = current.slice(1);
  return { ...basePayload(values), photos: image ? [image, ...rest] : rest };
}

/** Mascotas ordenadas por nombre (sin distinguir mayúsculas ni tildes). */
export function sortPetsByName(pets = []) {
  return [...pets].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { sensitivity: 'base' }),
  );
}
