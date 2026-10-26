export function jsonResponse(body, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status });
}

/** Espera (sondeando) a que se cumpla una condición; falla si pasa demasiado tiempo. */
export async function until(check, attempts = 100) {
  for (let i = 0; i < attempts; i += 1) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('La condición no se cumplió a tiempo.');
}
