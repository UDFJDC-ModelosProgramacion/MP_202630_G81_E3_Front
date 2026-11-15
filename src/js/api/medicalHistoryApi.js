import { request } from './httpClient.js';

const encode = encodeURIComponent;
const vetPath = (veterinarianId) => `/veterinarians/${encode(veterinarianId)}`;

/** Mascotas a cargo del veterinario (las de su refugio). */
export function listPetsInCharge(veterinarianId, options = {}) {
  return request(`${vetPath(veterinarianId)}/pets`, options);
}

/**
 * Historial médico de una mascota. El back responde 403 si la mascota no está a cargo del
 * veterinario y 404 si la mascota o el veterinario no existen.
 */
export function listMedicalRecords(veterinarianId, petId, options = {}) {
  return request(`${vetPath(veterinarianId)}/pets/${encode(petId)}/medical-records`, options);
}
