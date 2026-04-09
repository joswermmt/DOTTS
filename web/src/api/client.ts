const rawBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export const API_BASE = rawBase;

const TOKEN_KEY = "dotts_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiErrorBody = { error?: string; detalles?: unknown };

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers: hdrs, ...rest } = options;
  const headers = new Headers(hdrs);
  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (data ?? {}) as ApiErrorBody;
    throw new Error(err.error ?? `Error ${res.status}`);
  }
  return data as T;
}
