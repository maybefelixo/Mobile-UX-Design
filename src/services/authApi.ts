const API_BASE = "https://www2.hs-esslingen.de/~nitzsche/api/";

type ApiResult = {
  ok: boolean;
  data?: string;
  error?: string;
};

async function callApi(params: Record<string, string>): Promise<ApiResult> {
  try {
    const url = new URL(API_BASE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

  const json = await response.json();

  if (json.status !== "ok") {
    return { ok: false, error: json.message || "API-Fehler" };
  }
  
  return {
    ok: true,
    data: json.token || json.message || "ok",
  };

  } catch {
    return { ok: false, error: "Netzwerkfehler" };
  }
}

export async function registerUser(input: {
  userid: string;
  password: string;
  nickname: string;
  fullname: string;
}) {
  return callApi({
    request: "register",
    userid: input.userid,
    password: input.password,
    nickname: input.nickname,
    fullname: input.fullname,
  });
}

export async function loginUser(input: { userid: string; password: string }) {
  return callApi({
    request: "login",
    userid: input.userid,
    password: input.password,
  });
}

export async function deregisterUser(token: string) {
  return callApi({
    request: "deregister",
    token,
  });
}