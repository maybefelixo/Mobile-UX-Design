import { getApi, getBinaryApi, postApi, type ApiResult } from "./apiClient";

export type ChatSummary = {
  chatid: number;
  chatname: string;
  visibility: string;
  role: string;
  joined: boolean;
};

export type ChatMessage = {
  id?: number;
  userid?: string;
  time?: string;
  chatid?: number;
  text?: string;
  important?: boolean;
  usernick?: string;
};

export type UserProfile = {
  hash: string;
  nickname: string;
};

export type ChatInvite = {
  chatid: number;
  chatname: string;
};

function normalizeProfiles(raw: unknown): UserProfile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      return {
        hash: String(data.hash ?? ""),
        nickname: String(data.nickname ?? ""),
      };
    })
    .filter((p): p is UserProfile => p !== null);
}

function normalizeInvites(raw: unknown): ChatInvite[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      return {
        chatid: Number(data.chatid ?? 0),
        chatname: String(data.chatname ?? ""),
      };
    })
    .filter((i): i is ChatInvite => i !== null);
}

function normalizeChats(raw: unknown): ChatSummary[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      return {
        chatid: Number(data.chatid ?? 0),
        chatname: String(data.chatname ?? "Unbekannter Chat"),
        visibility: String(data.visibility ?? "private"),
        role: String(data.role ?? "none"),
        joined: Boolean(data.joined ?? false),
      };
    })
    .filter((chat): chat is ChatSummary => chat !== null);
}

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const mapped: Array<ChatMessage | null> = raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      return {
        id: data.id ? Number(data.id) : undefined,
        userid: data.userid ? String(data.userid) : undefined,
        time: data.time ? String(data.time) : undefined,
        chatid: data.chatid ? Number(data.chatid) : undefined,
        text: data.text ? String(data.text) : "",
        important: Boolean(data.important ?? false),
        usernick: data.usernick ? String(data.usernick) : undefined,
      };
    });

  return mapped.filter((msg): msg is ChatMessage => msg !== null);
}

export async function getChats(token: string): Promise<ApiResult<ChatSummary[]>> {
  return getApi(
    {
      request: "getchats",
      token,
    },
    (json) => normalizeChats(json.chats),
  );
}

export async function getMessages(
  token: string,
  chatid?: number,
  fromid?: number,
): Promise<ApiResult<ChatMessage[]>> {
  const params: Record<string, string> = {
    request: "getmessages",
    token,
  };

  if (typeof chatid === "number") params.chatid = String(chatid);
  if (typeof fromid === "number") params.fromid = String(fromid);

  return getApi(params, (json) => normalizeMessages(json.messages));
}

export async function postTextMessage(input: {
  token: string;
  text: string;
  chatid?: number;
}): Promise<ApiResult<string>> {
  return postMessage({ ...input });
}

export async function postMessage(input: {
  token: string;
  text?: string;
  photo?: string;
  position?: string;
  chatid?: number;
  important?: boolean;
}): Promise<ApiResult<string>> {
  const payload: Record<string, string | boolean | number> = {
    request: "postmessage",
    token: input.token,
  };

  if (input.text !== undefined) payload.text = input.text;
  if (input.photo !== undefined) payload.photo = input.photo;
  if (input.position !== undefined) payload.position = input.position;
  if (typeof input.chatid === "number") payload.chatid = input.chatid;
  if (input.important !== undefined) payload.important = input.important;

  return postApi(payload, (json) => json.message || "Nachricht gesendet.");
}

export async function getProfiles(token: string): Promise<ApiResult<UserProfile[]>> {
  return getApi(
    { request: "getprofiles", token },
    (json) => normalizeProfiles(json.profiles),
  );
}

export async function getInvites(token: string): Promise<ApiResult<ChatInvite[]>> {
  return getApi(
    { request: "getinvites", token },
    (json) => normalizeInvites(json.invites),
  );
}

export async function getPhoto(token: string, photoid: string): Promise<ApiResult<string>> {
  return getBinaryApi({ request: "getphoto", token, photoid });
}

export async function createChat(input: {
  token: string;
  chatname: string;
  ispublic?: boolean;
}): Promise<ApiResult<number>> {
  const params: Record<string, string> = {
    request: "createchat",
    token: input.token,
    chatname: input.chatname,
  };

  if (input.ispublic !== undefined) params.ispublic = String(input.ispublic);

  return getApi(params, (json) => Number(json.chatid ?? 0));
}

export async function deleteChat(token: string, chatid: number): Promise<ApiResult<string>> {
  return getApi(
    { request: "deletechat", token, chatid: String(chatid) },
    (json) => json.message || "Chat gelöscht.",
  );
}

export async function inviteUser(
  token: string,
  chatid: number,
  invitedhash: string,
): Promise<ApiResult<string>> {
  return getApi(
    { request: "invite", token, chatid: String(chatid), invitedhash },
    (json) => json.message || "Einladung gesendet.",
  );
}

export async function joinChat(token: string, chatid: number): Promise<ApiResult<string>> {
  return getApi(
    { request: "joinchat", token, chatid: String(chatid) },
    (json) => json.message || "Chat beigetreten.",
  );
}

export async function leaveChat(token: string, chatid: number): Promise<ApiResult<string>> {
  return getApi(
    { request: "leavechat", token, chatid: String(chatid) },
    (json) => json.message || "Chat verlassen.",
  );
}
