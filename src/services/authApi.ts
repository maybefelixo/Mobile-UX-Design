import { getApi, type ApiResult } from "./apiClient";

export async function registerUser(input: {
  userid: string;
  password: string;
  nickname: string;
  fullname: string;
}): Promise<ApiResult<{ token: string; hash: string }>> {
  return getApi(
    {
      request: "register",
      userid: input.userid,
      password: input.password,
      nickname: input.nickname,
      fullname: input.fullname,
    },
    (json) => ({ token: String(json.token || ""), hash: String(json.hash || "") }),
  );
}

export async function loginUser(input: {
  userid: string;
  password: string;
}): Promise<ApiResult<{ token: string; hash: string }>> {
  return getApi(
    {
      request: "login",
      userid: input.userid,
      password: input.password,
    },
    (json) => ({ token: String(json.token || ""), hash: String(json.hash || "") }),
  );
}

export async function deregisterUser(token: string): Promise<ApiResult<string>> {
  return getApi(
    {
      request: "deregister",
      token,
    },
    (json) => json.message || "Account wurde gelöscht.",
  );
}

export async function validateToken(token: string): Promise<ApiResult<string>> {
  return getApi(
    {
      request: "validatetoken",
      token,
    },
    (json) => json.message || "Token validiert.",
  );
}

export async function logoutUser(token: string): Promise<ApiResult<string>> {
  return getApi(
    { request: "logout", token },
    (json) => json.message || "Abgemeldet.",
  );
}

export async function editProfile(
  token: string,
  input: { nickname?: string; fullname?: string; password?: string },
): Promise<ApiResult<string>> {
  const params: Record<string, string> = { request: "editprofile", token };
  if (input.nickname !== undefined) params.nickname = input.nickname;
  if (input.fullname !== undefined) params.fullname = input.fullname;
  if (input.password !== undefined) params.password = input.password;
  return getApi(params, (json) => json.message || "Profil aktualisiert.");
}

