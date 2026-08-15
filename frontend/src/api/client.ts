/**
 * Typed fetch wrapper — all requests use HttpOnly session cookie.
 * Throws Error with backend detail message on non-2xx responses.
 */
export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string }).detail ||
        `Request failed with status ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export async function apiVoid(
  path: string,
  init: RequestInit = {}
): Promise<void> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string }).detail ||
        `Request failed with status ${res.status}`
    );
  }
}
