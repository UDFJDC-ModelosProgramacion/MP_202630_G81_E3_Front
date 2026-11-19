import { listAdopters } from '../api/adoptersApi.js';
import { listAdministrators } from '../api/administratorsApi.js';
import { listShelters } from '../api/sheltersApi.js';
import { listShelterVeterinarians } from '../api/veterinariansApi.js';

const asList = (value) => (Array.isArray(value) ? value : []);

const ADOPTER_API = { listAdopters };
const ADMINISTRATOR_API = { listAdministrators };
const SHELTER_API = { listShelters };
const VETERINARIAN_API = { listShelters, listShelterVeterinarians };

export async function adopterOptions(api = ADOPTER_API) {
  return asList(await api.listAdopters()).map((adopter) => ({
    value: String(adopter.id),
    label: adopter.name,
  }));
}

export async function administratorOptions(api = ADMINISTRATOR_API) {
  return asList(await api.listAdministrators()).map((admin) => ({
    value: String(admin.id),
    label: admin.name ?? admin.email ?? `Administrador ${admin.id}`,
  }));
}

export async function shelterOptions(api = SHELTER_API) {
  return asList(await api.listShelters()).map((shelter) => ({
    value: String(shelter.id),
    label: shelter.city ? `${shelter.name} · ${shelter.city}` : shelter.name,
  }));
}

export async function veterinarianOptions(api = VETERINARIAN_API) {
  const shelters = asList(await api.listShelters());
  const groups = await Promise.all(
    shelters.map(async (shelter) =>
      asList(await api.listShelterVeterinarians(shelter.id)).map((vet) => ({
        value: String(vet.id),
        label: `${vet.name} · ${shelter.name}`,
      })),
    ),
  );
  return groups.flat();
}
