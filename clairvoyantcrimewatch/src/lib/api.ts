/**
 * API layer for Clairvoyant Video Search.
 * Calls the FastAPI backend at http://localhost:8000/api/v1.
 * Auth token is stored in localStorage under the key "vs_token".
 */

import type { Camera, CameraGroup, SegmentResult, Entity, SavedSearch, Alert, SearchFilters } from "./types";

const BASE_URL = "http://localhost:8000/api/v1";
const TOKEN_KEY = "vs_token";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      message = err.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: { name: string; email: string } }> {
  const data = await request<{ token: string; user: { name: string; email: string } }>(
    "POST",
    "/auth/login",
    { email, password },
  );
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
  await request("POST", "/auth/forgot-password", { email });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------

export async function listCameras(): Promise<Camera[]> {
  return request<Camera[]>("GET", "/cameras");
}

export async function getCamera(cameraId: string): Promise<Camera | undefined> {
  try {
    return await request<Camera>("GET", `/cameras/${cameraId}`);
  } catch {
    return undefined;
  }
}

/**
 * GET /api/v1/cameras/groups
 * Backend returns { id, name, cameras: Camera[] }.
 * Frontend type expects { id, name, cameraIds: string[] }.
 */
export async function listCameraGroups(): Promise<CameraGroup[]> {
  const raw = await request<Array<{ id: string; name: string; cameras: Camera[] }>>(
    "GET",
    "/cameras/groups",
  );
  return raw.map((g) => ({
    id: g.id,
    name: g.name,
    cameraIds: g.cameras.map((c) => c.id),
    cameras: g.cameras,
  }));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchSegments(filters: SearchFilters): Promise<SegmentResult[]> {
  return request<SegmentResult[]>("POST", "/search", {
    query: filters.query ?? "",
    objectType: filters.objectType ?? "all",
    cameraIds: filters.cameraIds ?? [],
    cameraGroupId: filters.cameraGroupId ?? null,
    confidenceMin: filters.confidenceMin ?? 0,
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    sortBy: filters.sortBy ?? "time",
    sortOrder: filters.sortOrder ?? "desc",
  });
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export async function getEntity(entityId: string): Promise<Entity | undefined> {
  try {
    return await request<Entity>("GET", `/entities/${entityId}`);
  } catch {
    return undefined;
  }
}

export async function getEntitySegments(entityId: string): Promise<SegmentResult[]> {
  try {
    return await request<SegmentResult[]>("GET", `/entities/${entityId}/segments`);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Saved Searches
// ---------------------------------------------------------------------------

export async function listSavedSearches(): Promise<SavedSearch[]> {
  return request<SavedSearch[]>("GET", "/saved-searches");
}

export async function createSavedSearch(
  params: { name: string; query: string; filters: SearchFilters; resultCount?: number },
): Promise<SavedSearch> {
  return request<SavedSearch>("POST", "/saved-searches", {
    name: params.name,
    query: params.query,
    filters: params.filters,
    resultCount: params.resultCount ?? 0,
  });
}

export async function deleteSavedSearch(id: string): Promise<void> {
  return request("DELETE", `/saved-searches/${id}`);
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export async function listAlerts(): Promise<Alert[]> {
  return request<Alert[]>("GET", "/alerts");
}

export async function createAlert(
  alert: Omit<Alert, "id" | "createdAt">,
): Promise<Alert> {
  return request<Alert>("POST", "/alerts", {
    name: alert.name,
    query: alert.query,
    cameras: alert.cameras,
    timeWindow: alert.timeWindow,
    notificationChannel: alert.notificationChannel,
  });
}

export async function updateAlert(id: string, patch: { active?: boolean }): Promise<Alert> {
  return request<Alert>("PATCH", `/alerts/${id}`, patch);
}

export async function deleteAlert(id: string): Promise<void> {
  return request("DELETE", `/alerts/${id}`);
}
