import { request } from '../api/httpClient.js';
import { renderEmpty, renderError, renderLoading } from '../components/stateViews.js';
import { el, clear } from '../utils/dom.js';
import { friendlyMessage } from '../utils/errors.js';

const PETS_ENDPOINT = '/pets';
const PLACEHOLDER_IMAGE = 'assets/images/pet-placeholder.svg';

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

function formatPhoto(pet) {
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
  return typeof photo === 'string' && photo.trim() ? photo.trim() : PLACEHOLDER_IMAGE;
}

function normalizePet(pet, index) {
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
    photo: formatPhoto(pet),
    description: displayText(firstValue(pet.description, pet.descripcion), ''),
    breed: displayText(firstValue(pet.breed, pet.raza), ''),
  };
}

function renderStatus(status) {
  return el('span', { class: `pet-status pet-status--${status.kind}` }, status.label);
}

function makePetCard(pet, onOpen) {
  const image = el('img', {
    class: 'pet-card__image',
    src: pet.photo,
    alt: `Foto de ${pet.name}`,
    loading: 'lazy',
  });
  image.addEventListener('error', () => {
    if (image.getAttribute('src') !== PLACEHOLDER_IMAGE) {
      image.setAttribute('src', PLACEHOLDER_IMAGE);
    }
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

function openPetDetail(pet) {
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
    if (image.getAttribute('src') !== PLACEHOLDER_IMAGE)
      image.setAttribute('src', PLACEHOLDER_IMAGE);
  });

  const facts = el(
    'dl',
    { class: 'pet-dialog__facts' },
    el('dt', {}, 'Edad'),
    el('dd', {}, pet.age),
    el('dt', {}, 'Sexo'),
    el('dd', {}, pet.sex),
    el('dt', {}, 'Tamaño'),
    el('dd', {}, pet.size),
    el('dt', {}, 'Estado'),
    el('dd', {}, pet.status.label),
  );

  clear(dialog).append(
    el('div', { class: 'pet-dialog__top' }, image, closeButton),
    el(
      'section',
      { class: 'pet-dialog__body' },
      renderStatus(pet.status),
      el('h2', { id: 'pet-dialog-title', class: 'pet-dialog__title' }, pet.name),
      pet.breed ? el('p', { class: 'pet-dialog__breed' }, pet.breed) : null,
      facts,
      pet.description ? el('p', { class: 'pet-dialog__description' }, pet.description) : null,
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
