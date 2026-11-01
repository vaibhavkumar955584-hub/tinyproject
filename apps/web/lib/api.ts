const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...init.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string; code?: string };
    throw new ApiError(payload.message ?? 'The request could not be completed.', response.status, payload.code);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function apiBaseUrl(): string {
  return API_URL;
}
