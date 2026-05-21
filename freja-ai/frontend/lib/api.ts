const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function apiBaseUrl() {
  return typeof window === "undefined" ? BACKEND_URL : "/api";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("freja_token") : null;
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    throw new Error(error instanceof Error ? `Backend request failed: ${error.message}` : "Backend request failed");
  }
  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed with status ${response.status}`;
    try {
      const payload = JSON.parse(text) as { detail?: unknown; message?: unknown; error?: unknown };
      const parsedMessage = payload.detail ?? payload.message ?? payload.error;
      if (typeof parsedMessage === "string") {
        message = parsedMessage;
      }
    } catch {
      message = text || `Request failed with status ${response.status}`;
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function eventSource(path: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("freja_token") : null;
  const baseUrl = typeof window === "undefined" ? BACKEND_URL : window.location.origin + "/api";
  const url = new URL(`${baseUrl}${path}`);
  if (token) {
    url.searchParams.set("access_token", token);
  }
  return new EventSource(url.toString());
}
