/**
 * Typed fetch wrapper — all requests use the HttpOnly session cookie.
 * Automatically attaches the double-submit CSRF token on state-changing requests.
 * Throws Error with backend detail message on non-2xx responses.
 */

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)samraksha_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (UNSAFE.has(method)) {
    headers["X-CSRF-Token"] = getCsrfToken();
  }
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    method,
    headers,
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
