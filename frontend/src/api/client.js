import { API_URL } from '../config';

const TOKEN_KEY = 'token';

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_URL + path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStorage.get();
  if (token) headers['x-access-token'] = token;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(payload.message || 'Ocurrió un error inesperado', response.status);
  }

  return payload;
}
