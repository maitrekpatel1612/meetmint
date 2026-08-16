// ── Base API client (Facade layer) ────────────────────────────────────────
// All fetch logic lives here. UI components never touch raw fetch() or URLs.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

export const client = {
  get:    <T>(path: string)                      => request<T>(path),
  post:   <T>(path: string, body: unknown)       => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)       => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                      => request<T>(path, { method: 'DELETE' }),
};
