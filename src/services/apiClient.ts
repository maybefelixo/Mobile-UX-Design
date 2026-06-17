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
  invites?: unknown;
  chatid?: number;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  invalidToken?: boolean;
};

async function parseJson(response: Response): Promise<ApiEnvelope | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function checkInvalidToken(httpStatus: number, json?: ApiEnvelope | null): boolean {
  return httpStatus === 456 || json?.code === 456;
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
    const json = await parseJson(response);

    if (!response.ok || json?.status !== "ok") {
      return {
        ok: false,
        error: json?.message || `HTTP ${response.status}`,
        invalidToken: checkInvalidToken(response.status, json),
      };
    }

    return { ok: true, data: mapSuccess(json) };
  } catch {
    return { ok: false, error: "Netzwerkfehler" };
  }
}

export async function getBinaryApi(
  params: Record<string, string>,
): Promise<ApiResult<string>> {
  try {
    const url = new URL(API_BASE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}`,
        invalidToken: checkInvalidToken(response.status),
      };
    }

    const blob = await response.blob();
    return { ok: true, data: URL.createObjectURL(blob) };
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await parseJson(response);

    if (!response.ok || json?.status !== "ok") {
      return {
        ok: false,
        error: json?.message || `HTTP ${response.status}`,
        invalidToken: checkInvalidToken(response.status, json),
      };
    }

    return { ok: true, data: mapSuccess(json) };
  } catch {
    return { ok: false, error: "Netzwerkfehler" };
  }
}
