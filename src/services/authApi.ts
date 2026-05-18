import { getApi, type ApiResult } from "./apiClient";

export async function registerUser(input: {
  userid: string;
  password: string;
  nickname: string;
  fullname: string;
}): Promise<ApiResult<string>> {
  return getApi(
    {
      request: "register",
      userid: input.userid,
      password: input.password,
      nickname: input.nickname,
      fullname: input.fullname,
    },
    (json) => json.token || json.message || "ok",
  );
}

export async function loginUser(input: {
  userid: string;
  password: string;
}): Promise<ApiResult<string>> {
  return getApi(
    {
      request: "login",
      userid: input.userid,
      password: input.password,
    },
    (json) => json.token || json.message || "ok",
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