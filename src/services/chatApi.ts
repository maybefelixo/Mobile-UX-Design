import { getApi, postApi, type ApiResult } from "./apiClient";

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
): Promise<ApiResult<ChatMessage[]>> {
  const params: Record<string, string> = {
    request: "getmessages",
    token,
  };

  if (typeof chatid === "number") {
    params.chatid = String(chatid);
  }

  return getApi(params, (json) => normalizeMessages(json.messages));
}

export async function postTextMessage(input: {
  token: string;
  text: string;
  chatid?: number;
}): Promise<ApiResult<string>> {
  const payload: Record<string, string | number> = {
    request: "postmessage",
    token: input.token,
    text: input.text,
  };

  if (typeof input.chatid === "number") {
    payload.chatid = input.chatid;
  }

  return postApi(payload, (json) => json.message || "Nachricht gesendet.");
}
