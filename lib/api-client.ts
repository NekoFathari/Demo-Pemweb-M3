import type {
  AppState,
  PriorityLevel,
  QueueType,
  Ticket,
} from "@/lib/types";

/**
 * Typed wrappers for the HTTP API defined in CONTRACT.md.
 * Every non-ok response throws an Error carrying the server `{ error }` text.
 */

export interface AuthUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface QueueTypePatch {
  name?: string;
  active?: boolean;
}

function serverErrorMessage(body: unknown, status: number): string {
  if (
    body !== null &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string" &&
    (body as { error: string }).error.length > 0
  ) {
    return (body as { error: string }).error;
  }
  return `Permintaan gagal (HTTP ${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      cache: "no-store",
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body,
    });
  } catch {
    throw new Error(
      "Tidak dapat menghubungi server. Periksa koneksi, lalu coba lagi.",
    );
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(serverErrorMessage(body, res.status));
  }
  return body as T;
}

export function getState(): Promise<AppState> {
  return request<AppState>("/api/state");
}

export function createQueueType(code: string, name: string): Promise<QueueType> {
  return request<QueueType>("/api/queue-types", {
    method: "POST",
    body: JSON.stringify({ code, name }),
  });
}

export function updateQueueType(
  id: string,
  patch: QueueTypePatch,
): Promise<QueueType> {
  return request<QueueType>(
    `/api/queue-types/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
}

export function deleteQueueType(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(
    `/api/queue-types/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function createTicket(
  queueTypeId: string,
  priority: PriorityLevel,
): Promise<Ticket> {
  return request<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify({ queueTypeId, priority }),
  });
}

export function callTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/call`, {
    method: "POST",
  });
}

export function resetTickets(
  queueTypeId?: string,
): Promise<{ ok: true; removed: number; scope: string }> {
  return request<{ ok: true; removed: number; scope: string }>(
    "/api/tickets/reset",
    {
      method: "POST",
      body: JSON.stringify(queueTypeId ? { queueTypeId } : {}),
    },
  );
}

export function doneTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/done`, {
    method: "POST",
  });
}

export function skipTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/skip`, {
    method: "POST",
  });
}

export function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  let res: Response | null = null;
  try {
    res = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Tidak dapat menghubungi server. Periksa koneksi, lalu coba lagi.",
    );
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new Error(serverErrorMessage(body, res.status));
  }
}
