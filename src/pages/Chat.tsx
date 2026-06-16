import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteChat,
  getChats,
  getMessages,
  getPhoto,
  postTextMessage,
  type ChatMessage,
  type ChatSummary,
} from "../services/chatApi";
import { validateToken } from "../services/authApi";
import BottomNav from "../components/BottomNav";

type FilterType = "all" | "groups" | "unread";
type ViewMode = "list" | "detail";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500",
  "bg-rose-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

function parseDate(time: string): Date | null {
  if (!time) return null;
  // MySQL datetime "2024-05-07 15:30:00" → normalize to ISO 8601
  const normalized = time.trim().replace(" ", "T");
  let d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  // Unix timestamp as numeric string (seconds or milliseconds)
  const num = Number(time);
  if (!isNaN(num) && num > 0) {
    d = new Date(num > 1e10 ? num : num * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTime(time?: string): string {
  if (!time) return "";
  const date = parseDate(time);
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("de-DE", { month: "short", day: "numeric" });
}

function formatMsgTime(time?: string): string {
  if (!time) return "";
  const date = parseDate(time);
  if (!date) return "";
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(time?: string): string {
  if (!time) return "Heute";
  const date = parseDate(time);
  if (!date) return "Heute";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Heute";
  if (sameDay(date, yesterday)) return "Gestern";
  return date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string): boolean {
  const da = parseDate(a), db = parseDate(b);
  // If either date can't be parsed, assume same day to avoid phantom separators
  if (!da || !db) return true;
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function ChatListView({
  chats, selectedChatId, onSelectChat, loadingChats,
  searchTerm, onSearchChange, filterType, onFilterChange, onViewDetail,
}: {
  chats: ChatSummary[];
  selectedChatId: number | null;
  onSelectChat: (id: number) => void;
  loadingChats: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: FilterType;
  onFilterChange: (type: FilterType) => void;
  onViewDetail: () => void;
}) {
  const filtered = chats.filter((chat) => {
    if (filterType === "groups") return chat.visibility === "public";
    return true;
  }).filter((chat) =>
    chat.chatname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-blue-600">Study Chat</h1>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {(["all", "groups", "unread"] as FilterType[]).map((type) => {
          const label = type === "all" ? "Alle" : type === "groups" ? "Gruppen" : "Ungelesen";
          const active = filterType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onFilterChange(type)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Laden …</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Keine Chats gefunden.</p>
          </div>
        ) : (
          filtered.map((chat) => (
            <button
              key={chat.chatid}
              type="button"
              onClick={() => { onSelectChat(chat.chatid); onViewDetail(); }}
              className={[
                "flex w-full items-center gap-3 px-4 py-3 transition-colors",
                selectedChatId === chat.chatid ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              {/* Avatar */}
              <div className={[
                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold text-white",
                avatarColor(chat.chatname),
              ].join(" ")}>
                {getInitials(chat.chatname)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-slate-900">{chat.chatname}</span>
                  <span className="ml-2 flex-shrink-0 text-xs text-slate-400">
                    {formatTime(undefined)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {chat.visibility === "private" ? "🔒 Privat" : "🌐 Öffentlich"} · {chat.role}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function MessageStatus({ status }: { status?: "sending" | "error" }) {
  if (status === "sending") {
    return (
      <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l2.5 2.5" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  // undefined = confirmed by server → double tick
  return (
    <svg className="h-4 w-4 opacity-60" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6l4 4L13 2" />
      <path d="M7 6l4 4 6-8" />
    </svg>
  );
}

function PhotoMessage({ token, photoid }: { token: string; photoid: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPhoto(token, photoid).then((result) => {
      if (result.ok && result.data) setSrc(result.data);
      else setFailed(true);
    });
  }, [token, photoid]);

  if (failed) return <p className="text-xs opacity-60">Bild nicht verfügbar</p>;
  if (!src) return <div className="h-32 w-48 animate-pulse rounded-xl bg-black/10" />;
  return (
    <img
      src={src}
      alt="Bild"
      className="max-w-[220px] rounded-xl object-cover shadow-sm"
    />
  );
}

function ChatDetailView({
  token, chat, messages, loading, error, onBack, onSendMessage, sending,
}: {
  token: string;
  chat: ChatSummary | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onSendMessage: (text: string) => Promise<void>;
  sending: boolean;
}) {
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myUserid = useMemo(() => localStorage.getItem("userid") || "", []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!messageText.trim()) return;
    await onSendMessage(messageText);
    setMessageText("");
  }

  const chatName = chat?.chatname || "Chat";
  const initials = getInitials(chatName);
  const color = avatarColor(chatName);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 pb-3 pt-12 shadow-sm">
        <button type="button" onClick={onBack} className="mr-1 text-blue-600 lg:hidden">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={[
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
          color,
        ].join(" ")}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 leading-tight">{chatName}</p>
          <p className="text-xs text-slate-400">{chat?.role || ""}</p>
        </div>
        <button type="button" className="text-slate-400 hover:text-slate-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Laden …</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Noch keine Nachrichten.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = (msg.userid || "") === myUserid;
            const senderName = msg.usernick || msg.userid || "?";
            const showDate = i === 0 || (msg.time && messages[i - 1]?.time && !isSameDay(msg.time, messages[i - 1].time!));

            return (
              <div key={`${msg.id}-${i}`}>
                {/* Date separator */}
                {showDate ? (
                  <div className="flex items-center justify-center py-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-500">
                      {formatDateSeparator(msg.time)}
                    </span>
                  </div>
                ) : null}

                {/* Message bubble */}
                <div className={["flex items-end gap-2 mb-1", isOwn ? "flex-row-reverse" : "flex-row"].join(" ")}>
                  {/* Avatar (only for others) */}
                  {!isOwn ? (
                    <div className={[
                      "mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                      avatarColor(senderName),
                    ].join(" ")}>
                      {getInitials(senderName)}
                    </div>
                  ) : <div className="w-8 flex-shrink-0" />}

                  <div className={["max-w-[70%]", isOwn ? "items-end" : "items-start"].join(" flex flex-col ")}>
                    {/* Sender name (only for others) */}
                    {!isOwn ? (
                      <span className="mb-1 ml-1 text-xs font-medium text-slate-500">{senderName}</span>
                    ) : null}

                    <div className={[
                      msg.photoid ? "" : "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      !msg.photoid && isOwn ? "rounded-br-sm bg-blue-600 text-white" : "",
                      !msg.photoid && !isOwn ? "rounded-bl-sm bg-white text-slate-800" : "",
                    ].join(" ")}>
                      {msg.photoid
                        ? <PhotoMessage token={token} photoid={msg.photoid} />
                        : (msg.text || "(kein Text)")}
                    </div>

                    <div className={["mt-1 flex items-center gap-1 text-xs text-slate-400", isOwn ? "justify-end" : "ml-1"].join(" ")}>
                      <span>{formatMsgTime(msg.time)}</span>
                      {isOwn && <MessageStatus status={msg._status} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-4 py-1 text-xs text-red-500">{error}</p> : null}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white px-3 py-3 shadow-lg">
        <button type="button" className="flex-shrink-0 text-slate-400 hover:text-slate-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Send a message"
          className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={sending || !messageText.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow disabled:opacity-50"
        >
          <svg className="h-5 w-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const openChatId = (location.state as { openChatId?: number } | null)?.openChatId ?? null;
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    async function loadChats() {
      setLoadingChats(true);
      const result = await getChats(token);
      setLoadingChats(false);
      if (result.ok && result.data) setChats(result.data);
      else setError(result.error || "Chats konnten nicht geladen werden.");
    }
    void loadChats();
  }, [navigate, token]);

  useEffect(() => {
    if (!openChatId || chats.length === 0) return;
    const target = chats.find((c) => c.chatid === openChatId);
    if (target) { setSelectedChat(target); setViewMode("detail"); }
  }, [openChatId, chats]);

  useEffect(() => {
    if (!token || !selectedChat) return;
    async function loadMessages() {
      setLoadingMessages(true);
      if (!selectedChat) { setLoadingMessages(false); return; }
      const result = await getMessages(token, selectedChat.chatid);
      setLoadingMessages(false);
      if (result.ok && result.data) setMessages(result.data);
      else setError(result.error || "Nachrichten konnten nicht geladen werden.");
    }
    void loadMessages();
  }, [selectedChat, token]);

  async function handleSendMessage(text: string) {
    if (!token || !selectedChat) return;

    const tempId = Date.now();
    const optimistic: ChatMessage = {
      id: tempId,
      userid: localStorage.getItem("userid") || "",
      usernick: localStorage.getItem("nickname") || undefined,
      text: input.text,
      position: input.position,
      replyTo: replyToMessage?.id,
      localPreview: input.localPreview,
      time: new Date().toISOString(),
      chatid: selectedChat.chatid,
      important,
      _status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    setError("");
    const result = await postTextMessage({ token, text, chatid: selectedChat.chatid });
    setSending(false);
    if (!result.ok) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m));
      setError(result.error || "Nachricht konnte nicht gesendet werden.");
      // keep reply target so user can retry
      return;
    }
    const refreshed = await getMessages(token, selectedChat.chatid);
    if (refreshed.ok && refreshed.data) setMessages(refreshed.data);
  }

  async function handleSendPhoto(file: File) {
    if (!token || !selectedChat) return;
    let dataUrl: string;
    try { dataUrl = await toPngDataUrl(file); }
    catch { setError("Bild konnte nicht verarbeitet werden."); return; }
    const tempId = Date.now();
    const optimistic: ChatMessage = {
      id: tempId,
      userid: localStorage.getItem("userid") || "",
      usernick: localStorage.getItem("nickname") || undefined,
      time: new Date().toISOString(),
      chatid: selectedChat.chatid,
      _status: "sending",
      _localPhotoPreview: dataUrl,
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    setError("");
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const result = await postMessage({ token, photo: base64, chatid: selectedChat.chatid });
    setSending(false);
    if (!result.ok) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m));
      setError(result.error || "Foto konnte nicht gesendet werden.");
      return;
    }
    const refreshed = await getMessages(token, selectedChat.chatid);
    if (refreshed.ok && refreshed.data) setMessages(refreshed.data);
    setReplyToMessage(null);
  }

  async function handleDeleteMessage(msg: ChatMessage) {
    if (!msg.id || !token) return;
    if (!confirm("Nachricht wirklich löschen?")) return;

    // optimistic remove
    const old = messages;
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));

    const res = await deleteMessage(token, msg.id);
    if (!res.ok) {
      setMessages(old);
      setError(res.error || "Löschen fehlgeschlagen.");
    }
  }

  async function handleSendMessage(text: string) {
    await sendChatPayload({ text });
  }

  async function handleSendPhoto(photo: string) {
    await sendChatPayload({ photo: stripDataUrlPrefix(photo), localPreview: photo });
  }

  async function handleSendLocation(position: string) {
    await sendChatPayload({ position });
  }

  async function handleSendLocation() {
    if (!token || !selectedChat) return;
    if (!navigator.geolocation) { setError("GPS nicht verfügbar."); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const position = JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        const tempId = Date.now();
        const optimistic: ChatMessage = {
          id: tempId,
          userid: localStorage.getItem("userid") || "",
          usernick: localStorage.getItem("nickname") || undefined,
          time: new Date().toISOString(),
          chatid: selectedChat.chatid,
          _status: "sending",
          position,
        };
        setMessages((prev) => [...prev, optimistic]);
        setSending(true);
        setError("");
        const result = await postMessage({ token, text: "Standort", position, chatid: selectedChat.chatid });
        setSending(false);
        if (!result.ok) {
          setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m));
          setError(result.error || "Standort konnte nicht gesendet werden.");
          return;
        }
        const refreshed = await getMessages(token, selectedChat.chatid);
        if (refreshed.ok && refreshed.data) setMessages(refreshed.data);
      },
      () => setError("Standort konnte nicht ermittelt werden."),
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white lg:grid lg:grid-cols-[360px_1fr]">
      <div className={viewMode === "list" ? "flex h-screen flex-col" : "hidden lg:flex lg:h-screen lg:flex-col"}>
        <ChatListView
          chats={chats.filter((c) => c.joined)}
          selectedChatId={selectedChat?.chatid ?? null}
          onSelectChat={(id) => setSelectedChat(chats.find((c) => c.chatid === id) || null)}
          loadingChats={loadingChats}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
          onViewDetail={() => setViewMode("detail")}
        />
        <BottomNav />
      </div>

      <div className={viewMode === "detail" ? "flex h-screen flex-col" : "hidden lg:flex lg:h-screen lg:flex-col"}>
        <ChatDetailView
          token={token}
          chat={selectedChat}
          messages={messages}
          loading={loadingMessages}
          error={error}
          onBack={() => setViewMode("list")}
          onSendMessage={handleSendMessage}
          sending={sending}
        />
      </div>
    </div>
  );
}
