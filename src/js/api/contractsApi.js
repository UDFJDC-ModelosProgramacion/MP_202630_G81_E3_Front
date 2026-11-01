import { request } from './httpClient.js';

const encode = encodeURIComponent;

/** Contrato de adopción por su id. */
export function getContract(contractId, options = {}) {
  return request(`/adoption-contracts/${encode(contractId)}`, options);
}

/**
 * Contrato asociado a una adopción, o `null` si la adopción aún no tiene uno.
 * El back expone el contrato dentro del detalle de la adopción.
 */
export async function getAdoptionContract(adoptionId, options = {}) {
  const adoption = await request(`/adoptions/${encode(adoptionId)}`, options);
  return adoption?.contract ?? null;
}
