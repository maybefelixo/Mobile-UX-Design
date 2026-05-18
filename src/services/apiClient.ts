const API_BASE = "https://www2.hs-esslingen.de/~nitzsche/api/";

type ApiStatus = "ok" | "error";

type ApiEnvelope = {
  status?: ApiStatus;
  message?: string;
  code?: number;
  token?: string;
  hash?: string;
  chats?: unknown;
  messages?: unknown;
  profiles?: unknown;
  chatid?: number;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function getErrorMessage(json: ApiEnvelope): string {
  return json.message || "API-Fehler";
}

export async function getApi<T>(
  params: Record<string, string>,
  mapSuccess: (json: ApiEnvelope) => T,
): Promise<ApiResult<T>> {
  try {
    const url = new URL(API_BASE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const json: ApiEnvelope = await response.json();
    if (json.status !== "ok") {
      return { ok: false, error: getErrorMessage(json) };
    }

    return { ok: true, data: mapSuccess(json) };
  } catch {
    return { ok: false, error: "Netzwerkfehler" };
  }
}

export async function postApi<T>(
  body: Record<string, string | boolean | number>,
  mapSuccess: (json: ApiEnvelope) => T,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const json: ApiEnvelope = await response.json();
    if (json.status !== "ok") {
      return { ok: false, error: getErrorMessage(json) };
    }

    return { ok: true, data: mapSuccess(json) };
  } catch {
    return { ok: false, error: "Netzwerkfehler" };
  }
}
