/**
 * Small fetch wrapper. `credentials: 'include'` sends the httpOnly auth cookie;
 * the token itself is never readable from JavaScript.
 */
const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const detail = data?.errors?.length ? data.errors.map((e) => e.message).join('. ') : data?.message;
    throw new ApiError(detail || `Request failed (${res.status})`, res.status, data?.errors || []);
  }
  return data;
}
