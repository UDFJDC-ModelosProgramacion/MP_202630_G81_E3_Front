import { friendlyMessage } from '../utils/errors.js';

/**
 * Asocia un administrador a varios refugios, uno a uno.
 * Un fallo no detiene los demás: se reporta aparte con el mensaje del back.
 */
export async function associateShelters(associate, administratorId, shelterIds) {
  const result = { associated: [], failures: [] };
  for (const shelterId of shelterIds) {
    try {
      await associate(administratorId, shelterId);
      result.associated.push(shelterId);
    } catch (error) {
      result.failures.push({ shelterId, message: friendlyMessage(error) });
    }
  }
  return result;
}

/** Convierte el resultado de la asociación en el contenido de una alerta. */
export function summarizeAssociation(administratorName, { associated, failures }, shelterNameOf) {
  const details = failures.map(
    ({ shelterId, message }) => `${shelterNameOf(shelterId)}: ${message}`,
  );
  if (failures.length === 0) {
    return {
      kind: 'success',
      message: `Refugios asociados a ${administratorName}: ${associated.length}.`,
      details,
    };
  }
  if (associated.length === 0) {
    return { kind: 'danger', message: `No se pudo asociar a ${administratorName}.`, details };
  }
  return {
    kind: 'warning',
    message: `La asociación de ${administratorName} se completó parcialmente.`,
    details,
  };
}
