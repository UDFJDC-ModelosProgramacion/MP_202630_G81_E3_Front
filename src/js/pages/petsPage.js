import { request } from '../api/httpClient.js';
import { getPet } from '../api/petManagementApi.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { el, clear } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';
import { speciesImage, speciesLabel } from '../utils/petImage.js';

const PETS_ENDPOINT = '/pets';

function extractPets(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['content', 'data', 'items', 'pets', 'mascotas']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function displayText(value, fallback = 'No disponible') {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!birthdayHasPassed) years -= 1;
  return years >= 0 ? years : null;
}

function formatAge(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value} ${value === 1 ? 'año' : 'años'}`;
  }
  if (typeof value === 'string' && value.trim()) {
    const cleanValue = value.trim();
    if (/^\d+(\.\d+)?$/.test(cleanValue)) {
      const age = Number(cleanValue);
      return `${cleanValue} ${age === 1 ? 'año' : 'años'}`;
    }
    return cleanValue;
  }
  return 'Edad no disponible';
}

function formatSex(value) {
  const sex = displayText(value, '').toLowerCase();
  if (!sex) return 'Sexo no disponible';
  if (['m', 'male', 'masculino', 'macho', 'man'].includes(sex)) return 'Macho';
  if (['f', 'female', 'femenino', 'hembra', 'woman'].includes(sex)) return 'Hembra';
  return displayText(value);
}

function formatSize(value) {
  const size = displayText(value, '').toLowerCase().replaceAll('_', ' ');
  if (!size) return 'Tamaño no disponible';
  if (size.includes('peque') || size === 'small' || size === 's') return 'Tamaño pequeño';
  if (size.includes('median') || size === 'medium' || size === 'm') return 'Tamaño mediano';
  if (size.includes('grand') || size === 'large' || size === 'l') return 'Tamaño grande';
  return size.startsWith('tamaño')
    ? displayText(value)
    : `Tamaño ${displayText(value).toLowerCase()}`;
}

function formatStatus(value) {
  const status = displayText(value, '').toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ');
  if (!status) return { label: 'Estado no disponible', kind: 'unknown', available: false };
  if (status.includes('available') || status.includes('disponible')) {
    return { label: 'Disponible', kind: 'available', available: true };
  }
  if (status.includes('process') || status.includes('proceso') || status.includes('pending')) {
    return { label: 'En proceso', kind: 'process', available: false };
  }
  if (status.includes('adopt')) {
    return { label: 'Adoptada', kind: 'adopted', available: false };
  }
  return { label: displayText(value), kind: 'unknown', available: false };
}

function formatPhoto(pet, species = '') {
  const photos = firstValue(pet.photos, pet.fotos, pet.images, pet.imagenes);
  const firstPhoto = Array.isArray(photos) ? photos[0] : undefined;
  const photo = firstValue(
    pet.photo,
    pet.foto,
    pet.image,
    pet.imagen,
    pet.imageUrl,
    pet.imageURL,
    pet.photoUrl,
    pet.urlFoto,
    pet.urlImagen,
    typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url,
  );
  return typeof photo === 'string' && photo.trim() ? photo.trim() : speciesImage(species);
}

export function normalizePet(pet, index) {
  const age = firstValue(
    pet.age,
    pet.edad,
    pet.ageYears,
    pet.edadAnios,
    calculateAge(firstValue(pet.birthDate, pet.fechaNacimiento, pet.dateOfBirth)),
  );
  const status = formatStatus(
    firstValue(pet.status, pet.estado, pet.adoptionStatus, pet.estadoAdopcion),
  );

  return {
    id: firstValue(pet.id, pet.petId, pet.idMascota, pet.mascotaId, index),
    name: displayText(firstValue(pet.name, pet.nombre), 'Mascota sin nombre'),
    age: formatAge(age),
    sex: formatSex(firstValue(pet.sex, pet.sexo, pet.gender, pet.genero)),
    size: formatSize(firstValue(pet.size, pet.tamano, pet.tamaño, pet.talla)),
    status,
    photo: formatPhoto(pet, pet.species),
    description: displayText(firstValue(pet.description, pet.descripcion), ''),
    breed: displayText(firstValue(pet.breed, pet.raza), ''),
    species: displayText(pet.species, ''),
    temperament: displayText(pet.temperament, ''),
    specialNeeds: displayText(pet.specialNeeds, ''),
    shelterId: pet.shelter?.id ?? null,
    photos: Array.isArray(pet.photos) ? pet.photos.filter((url) => typeof url === 'string') : [],
    activityLevel: firstValue(pet.activityLevel, null),
    spaceRequirement: firstValue(pet.spaceRequirement, null),
    compatibleWithChildren: pet.compatibleWithChildren ?? null,
    compatibleWithOtherPets: pet.compatibleWithOtherPets ?? null,
  };
}

function renderStatus(status) {
  return el('span', { class: `pet-status pet-status--${status.kind}` }, status.label);
}

export function makePetCard(pet, onOpen) {
  const image = el('img', {
    class: 'pet-card__image',
    src: pet.photo,
    alt: `Foto de ${pet.name}`,
    loading: 'lazy',
  });
  image.addEventListener('error', () => {
    const fallback = speciesImage(pet.species);
    if (image.getAttribute('src') !== fallback) image.setAttribute('src', fallback);
  });

  return el(
    'button',
    {
      class: 'pet-card',
      type: 'button',
      'aria-label': `Ver detalles de ${pet.name}`,
      onClick: () => onOpen(pet),
    },
    el(
      'span',
      { class: `pet-card__visual pet-card__visual--${pet.status.kind}` },
      image,
      renderStatus(pet.status),
    ),
    el(
      'span',
      { class: 'pet-card__body' },
      el('span', { class: 'pet-card__name' }, pet.name),
      pet.species ? el('span', { class: 'pet-card__species' }, speciesLabel(pet.species)) : null,
      el(
        'span',
        { class: 'chips', 'aria-label': 'Características de la mascota' },
        el('span', { class: 'chip' }, pet.age),
        el('span', { class: 'chip' }, pet.sex),
        el('span', { class: 'chip' }, pet.size),
      ),
    ),
  );
}

/** Raza del detalle: nombre y descripción completos, o «Raza no registrada». */
async function paintBreed(box, petId, fetchPet) {
  renderLoading(box, 'Cargando raza…');
  try {
    const detail = await fetchPet(petId);
    const name = typeof detail?.breed?.name === 'string' ? detail.breed.name.trim() : '';
    if (!name) {
      clear(box).append(el('p', { class: 'pet-dialog__breed-empty' }, 'Raza no registrada'));
      box.setAttribute('aria-busy', 'false');
      return;
    }
    const description = String(detail.breed.description ?? '').trim();
    box.setAttribute('aria-busy', 'false');
    clear(box).append(
      el('h3', { class: 'pet-dialog__breed-name' }, name),
      el(
        'p',
        { class: 'pet-dialog__breed-description' },
        description || 'Esta raza aún no tiene una descripción registrada.',
      ),
    );
  } catch (error) {
    if (error?.status === 404) {
      renderError(box, {
        title: 'La mascota no existe',
        text: 'No encontramos esta mascota; puede haber sido eliminada.',
      });
      return;
    }
    renderError(box, {
      title: 'No pudimos cargar la raza',
      text: friendlyMessage(error),
      onRetry: () => paintBreed(box, petId, fetchPet),
    });
  }
}

export function openPetDetail(pet, { fetchPet = getPet } = {}) {
  const breedBox = el('section', { class: 'pet-dialog__breed', 'aria-label': 'Raza' });
  paintBreed(breedBox, pet.id, fetchPet);
  const dialog = el('dialog', {
    class: 'pet-dialog',
    'aria-labelledby': 'pet-dialog-title',
  });
  const closeButton = el(
    'button',
    {
      class: 'pet-dialog__close',
      type: 'button',
      'aria-label': 'Cerrar detalle',
      onClick: () => dialog.close(),
    },
    '×',
  );

  const image = el('img', {
    class: 'pet-dialog__image',
    src: pet.photo,
    alt: `Foto de ${pet.name}`,
  });
  image.addEventListener('error', () => {
    const fallback = speciesImage(pet.species);
    if (image.getAttribute('src') !== fallback) image.setAttribute('src', fallback);
  });

  const facts = el(
    'dl',
    { class: 'pet-dialog__facts' },
    pet.species ? el('dt', {}, 'Especie') : null,
    pet.species ? el('dd', {}, speciesLabel(pet.species)) : null,
    el('dt', {}, 'Edad'),
    el('dd', {}, pet.age),
    el('dt', {}, 'Sexo'),
    el('dd', {}, pet.sex),
    el('dt', {}, 'Tamaño'),
    el('dd', {}, pet.size),
    el('dt', {}, 'Estado'),
    el('dd', {}, pet.status.label),
    pet.temperament ? el('dt', {}, 'Temperamento') : null,
    pet.temperament ? el('dd', {}, pet.temperament) : null,
    pet.specialNeeds ? el('dt', {}, 'Necesidades') : null,
    pet.specialNeeds ? el('dd', {}, pet.specialNeeds) : null,
  );

  const gallery =
    pet.photos.length > 1
      ? el(
          'div',
          { class: 'fx-gallery', 'aria-label': `Más fotos de ${pet.name}` },
          ...pet.photos
            .slice(0, 8)
            .map((url, index) =>
              el('img', { src: url, alt: `Foto ${index + 1} de ${pet.name}`, loading: 'lazy' }),
            ),
        )
      : null;

  clear(dialog).append(
    el('div', { class: 'pet-dialog__top' }, image, closeButton),
    el(
      'section',
      { class: 'pet-dialog__body' },
      renderStatus(pet.status),
      el('h2', { id: 'pet-dialog-title', class: 'pet-dialog__title' }, pet.name),
      facts,
      breedBox,
      gallery,
      pet.description ? el('p', { class: 'pet-dialog__description' }, pet.description) : null,
      el(
        'div',
        { class: 'pet-dialog__links' },
        el(
          'a',
          { class: 'btn btn--outline', href: `eventos.html?petId=${encodeURIComponent(pet.id)}` },
          'Ver historial de eventos',
        ),
        el(
          'a',
          { class: 'btn btn--outline', href: `raza.html?petId=${encodeURIComponent(pet.id)}` },
          'Ver raza',
        ),
        el(
          'a',
          { class: 'btn btn--outline', href: `vacunacion.html?pet=${encodeURIComponent(pet.id)}` },
          'Carné de vacunación',
        ),
        pet.shelterId
          ? el(
              'a',
              {
                class: 'btn btn--outline',
                href: `mensajes.html?shelter=${encodeURIComponent(pet.shelterId)}&pet=${encodeURIComponent(pet.id)}`,
              },
              'Escribir al refugio',
            )
          : null,
      ),
    ),
  );

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

export function renderPetsPage(mount) {
  let allPets = [];
  let onlyAvailable = false;

  const count = el(
    'p',
    { class: 'pets-toolbar__count', 'aria-live': 'polite' },
    'Cargando mascotas…',
  );
  const filterButton = el(
    'button',
    {
      class: 'btn btn--primary pets-filter',
      type: 'button',
      'aria-pressed': 'false',
      onClick: () => {
        onlyAvailable = !onlyAvailable;
        filterButton.setAttribute('aria-pressed', String(onlyAvailable));
        filterButton.textContent = onlyAvailable ? 'Mostrar todas' : 'Filtrar disponibles';
        renderCards();
      },
    },
    'Filtrar disponibles',
  );
  const grid = el('section', {
    id: 'pets-grid',
    class: 'pets-grid-wrap',
    'aria-label': 'Listado de mascotas',
  });

  function renderCards() {
    const visiblePets = onlyAvailable ? allPets.filter((pet) => pet.status.available) : allPets;
    count.textContent = `${allPets.length} ${allPets.length === 1 ? 'mascota registrada' : 'mascotas registradas'}`;
    clear(grid);

    if (visiblePets.length === 0) {
      grid.classList.remove('pets-grid');
      renderEmpty(grid, {
        title: onlyAvailable ? 'No hay mascotas disponibles' : 'Aún no hay mascotas registradas',
        text: onlyAvailable
          ? 'En este momento no hay mascotas disponibles para adopción. Puedes consultar el listado completo.'
          : 'Cuando el refugio registre mascotas, aparecerán aquí.',
        actionLabel: onlyAvailable ? 'Mostrar todas' : undefined,
        onAction: onlyAvailable
          ? () => {
              onlyAvailable = false;
              filterButton.setAttribute('aria-pressed', 'false');
              filterButton.textContent = 'Filtrar disponibles';
              renderCards();
            }
          : undefined,
      });
      return;
    }

    grid.classList.add('pets-grid');
    grid.append(...visiblePets.map((pet) => makePetCard(pet, openPetDetail)));
  }

  clear(mount).append(
    el(
      'section',
      { class: 'pets-hero', id: 'mascotas' },
      el(
        'div',
        { class: 'pets-hero__copy' },
        el('p', { class: 'eyebrow' }, 'NUESTRO REFUGIO'),
        el('h1', { class: 'page-title' }, 'Conoce a las mascotas del refugio'),
        el(
          'p',
          { class: 'page-lead' },
          'Explora a todas las mascotas registradas y encuentra a tu próximo mejor amigo.',
        ),
      ),
      el('span', { class: 'pets-hero__paw', 'aria-hidden': 'true' }, '🐾'),
    ),
    el('div', { class: 'pets-toolbar' }, count, filterButton),
    grid,
  );

  async function loadPets() {
    renderLoading(grid, 'Cargando mascotas…');
    count.textContent = 'Cargando mascotas…';

    try {
      const payload = await request(PETS_ENDPOINT);
      allPets = extractPets(payload).map(normalizePet);
      renderCards();
    } catch (error) {
      count.textContent = 'No se pudo obtener el listado';
      renderError(grid, {
        title: 'No pudimos cargar las mascotas',
        text: friendlyMessage(error),
        onRetry: loadPets,
      });
    }
  }

  loadPets();
}
