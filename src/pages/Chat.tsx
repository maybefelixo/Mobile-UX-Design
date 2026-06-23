import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteMessage,
  getChats,
  getMessages,
  getPhoto,
  postMessage,
  type ChatMessage,
  type ChatSummary,
} from "../services/chatApi";
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

function PhotoMessage({ token, photoid, mimetype }: { token: string; photoid: string; mimetype?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPhoto(token, photoid).then((result) => {
      if (result.ok && result.data) setSrc(result.data);
      else setFailed(true);
    });
  }, [token, photoid]);

  if (failed) return <p className="text-xs opacity-60">Datei nicht verfügbar</p>;
  if (!src) return <div className="h-32 w-48 animate-pulse rounded-xl bg-black/10" />;
  const isImage = mimetype ? mimetype.startsWith("image/") : src.startsWith("data:image/");
  if (!isImage) {
    const ext = (mimetype ?? "").split("/")[1]?.toUpperCase() ?? "DATEI";
    return (
      <a href={src} download className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-slate-200">
        <svg className="h-8 w-8 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-medium">{ext}-Datei</span>
      </a>
    );
  }
  return <img src={src} alt="Bild" className="max-w-[220px] rounded-xl object-cover shadow-sm" />;
}

function ChatDetailView({
  token, chat, messages, loading, error, onBack, onSendMessage, onSendFile, onDeleteMessage, sending,
}: {
  token: string;
  chat: ChatSummary | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onSendMessage: (text: string, replyto?: number) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onDeleteMessage: (id: number) => Promise<void>;
  sending: boolean;
}) {
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myUserid = useMemo(() => localStorage.getItem("userid") || "", []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!messageText.trim()) return;
    const replyto = replyingTo?.id;
    setReplyingTo(null);
    await onSendMessage(messageText, replyto);
    setMessageText("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await onSendFile(file);
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
            const senderName = msg.userfullname || msg.usernick || msg.userid || "?";
            const showDate = i === 0 || (msg.time && messages[i - 1]?.time && !isSameDay(msg.time, messages[i - 1].time!));
            const quotedMsg = msg.replyTo != null ? messages.find((m) => m.id === msg.replyTo) : null;

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

                    {/* Quoted reply block */}
                    {quotedMsg ? (
                      <div className={[
                        "mb-1 rounded-xl border-l-4 px-3 py-1.5 text-xs",
                        isOwn
                          ? "border-blue-300 bg-blue-500/30 text-blue-100"
                          : "border-slate-300 bg-slate-100 text-slate-500",
                      ].join(" ")}>
                        <p className="font-semibold">
                          {quotedMsg.usernick || quotedMsg.userid || "?"}
                        </p>
                        <p className="truncate">{quotedMsg.text || "(Datei)"}</p>
                      </div>
                    ) : null}

                    <div className={[
                      msg.photoid ? "" : "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      !msg.photoid && isOwn ? "rounded-br-sm bg-blue-600 text-white" : "",
                      !msg.photoid && !isOwn ? "rounded-bl-sm bg-white text-slate-800" : "",
                    ].join(" ")}>
                      {msg.photoid
                        ? <PhotoMessage token={token} photoid={msg.photoid} mimetype={msg.mimetype} />
                        : (msg.text || "(kein Text)")}
                    </div>

                    <div className={["mt-1 flex items-center gap-1 text-xs text-slate-400", isOwn ? "justify-end" : "ml-1"].join(" ")}>
                      <span>{formatMsgTime(msg.time)}</span>
                      {isOwn && <MessageStatus status={msg._status} />}
                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="ml-1 opacity-50 hover:opacity-100"
                        title="Antworten"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" />
                        </svg>
                      </button>
                      {/* Delete button (own messages only) */}
                      {isOwn && msg.id != null ? (
                        <button
                          type="button"
                          onClick={() => onDeleteMessage(msg.id!)}
                          className="ml-1 opacity-50 hover:opacity-100 hover:text-red-400"
                          title="Löschen"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      ) : null}
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

      {/* Reply preview bar */}
      {replyingTo ? (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
          <div className="flex-1 rounded-lg bg-slate-100 px-3 py-1.5">
            <p className="text-xs font-semibold text-blue-600">
              Antwort an {replyingTo.usernick || replyingTo.userid || "?"}
            </p>
            <p className="truncate text-xs text-slate-500">{replyingTo.text || "(Datei)"}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white px-3 py-3 shadow-lg">
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} className="flex-shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-50">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed" className="hidden" onChange={handleFileChange} />
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
    const chatid = selectedChat.chatid;

    async function loadMessages(initial: boolean) {
      if (initial) setLoadingMessages(true);
      const result = await getMessages(token, chatid);
      if (initial) setLoadingMessages(false);
      if (result.ok && result.data) setMessages(result.data);
      else if (initial) setError(result.error || "Nachrichten konnten nicht geladen werden.");
    }

    void loadMessages(true);
    const interval = setInterval(() => void loadMessages(false), 3000);
    return () => clearInterval(interval);
  }, [selectedChat, token]);

  async function handleSendMessage(text: string, replyto?: number) {
    if (!token || !selectedChat) return;

    setSending(true);
    setError("");

    const result = await postMessage({ token, text, chatid: selectedChat.chatid, replyto });
    setSending(false);

    if (!result.ok) {
      setError(result.error || "Nachricht konnte nicht gesendet werden.");
      return;
    }

    const refreshed = await getMessages(token, selectedChat.chatid);
    if (refreshed.ok && refreshed.data) setMessages(refreshed.data);
  }

  async function handleDeleteMessage(id: number) {
    if (!token) return;
    await deleteMessage(token, id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSendFile(file: File) {
    if (!token || !selectedChat) return;
    setSending(true);
    setError("");
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const result = await postMessage({ token, chatid: selectedChat.chatid, photo: base64, mimetype: file.type || undefined });
    setSending(false);
    if (!result.ok) { setError(result.error || "Datei konnte nicht gesendet werden."); return; }
    const refreshed = await getMessages(token, selectedChat.chatid);
    if (refreshed.ok && refreshed.data) setMessages(refreshed.data);
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
          onSendFile={handleSendFile}
          onDeleteMessage={handleDeleteMessage}
          sending={sending}
        />
      </div>
    </div>
  );
}
