import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isNotFound() {
    return this.status === 404;
  }
}


export function buildUrl(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

function extractMessage(body, fallback) {
  const message = body?.apierror?.message ?? body?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}


export async function request(
  path,
  { method = 'GET', params, body, signal, timeoutMs = REQUEST_TIMEOUT_MS } = {},
) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    const message = timedOut
      ? 'El servidor tardó demasiado en responder.'
      : 'No se pudo conectar con el servidor.';
    throw new ApiError(message, { status: 0, cause });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(extractMessage(payload, `Error ${response.status} del servidor.`), {
      status: response.status,
    });
  }
  return payload;
}
