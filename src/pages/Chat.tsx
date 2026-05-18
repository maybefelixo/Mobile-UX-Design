import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  getChats,
  getMessages,
  postTextMessage,
  type ChatMessage,
  type ChatSummary,
} from "../services/chatApi";

type FilterType = "all" | "groups" | "unread";
type ViewMode = "list" | "detail";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatTime(time?: string): string {
  if (!time) return "";
  try {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "jetzt";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString("de-DE", { month: "short", day: "numeric" });
  } catch {
    return time;
  }
}

function ChatListView({
  chats,
  selectedChatId,
  onSelectChat,
  loadingChats,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  onViewDetail,
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
  const filteredChats = chats.filter(() => {
    if (filterType === "groups") {
      return true;
    }
    if (filterType === "unread") {
      return false;
    }
    return true;
  });

  const searchedChats = filteredChats.filter((chat) =>
    chat.chatname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 lg:h-auto">
      <header className="bg-white px-4 py-4 shadow-sm lg:rounded-t-2xl">
        <h1 className="text-2xl font-bold text-blue-600">Study Chat</h1>
      </header>

      <div className="space-y-3 border-b border-slate-200 bg-white px-4 py-3 lg:rounded-b-2xl">
        <div className="relative">
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Suchen ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={[
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              filterType === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600",
            ].join(" ")}
          >
            Alle
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("groups")}
            className={[
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              filterType === "groups"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600",
            ].join(" ")}
          >
            Gruppen
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("unread")}
            className={[
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              filterType === "unread"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600",
            ].join(" ")}
          >
            Ungelesen
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-slate-500">Lade Chats ...</p>
          </div>
        ) : searchedChats.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-slate-500">Keine Chats gefunden.</p>
          </div>
        ) : (
          <div className="space-y-1 px-2 py-2">
            {searchedChats.map((chat) => (
              <button
                key={chat.chatid}
                type="button"
                onClick={() => {
                  onSelectChat(chat.chatid);
                  onViewDetail();
                }}
                className={[
                  "w-full rounded-lg px-3 py-3 text-left transition-all",
                  selectedChatId === chat.chatid
                    ? "bg-blue-50"
                    : "hover:bg-slate-100",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {getInitials(chat.chatname)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{chat.chatname}</h3>
                      <span className="flex-shrink-0 text-xs text-slate-500">jetzt</span>
                    </div>
                    <p className="truncate text-xs text-slate-600">
                      {chat.visibility === "private" ? "🔒" : "🌐"} {chat.role}
                    </p>
                  </div>

                  {Math.random() > 0.7 ? (
                    <div className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                      1
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatDetailView({
  chat,
  messages,
  loading,
  error,
  onBack,
  onSendMessage,
  sending,
}: {
  chat: ChatSummary | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onSendMessage: (text: string) => Promise<void>;
  sending: boolean;
}) {
  const [messageText, setMessageText] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!messageText.trim()) return;
    await onSendMessage(messageText);
    setMessageText("");
  }

  return (
    <div className="flex h-screen flex-col bg-white lg:h-auto">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:rounded-t-2xl">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 lg:hidden"
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">{chat?.chatname || "Chat"}</h2>
          <p className="text-xs text-slate-500">{chat?.role || ""}</p>
        </div>
        <button
          type="button"
          onClick={() => {}}
          className="text-slate-600 hover:text-slate-900"
        >
          ⋮
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 bg-slate-50 p-3">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-slate-500">Lade Nachrichten ...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-slate-500">Keine Nachrichten.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.time}`}
              className="flex gap-2 text-sm"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-slate-700">
                {getInitials(msg.usernick || msg.userid || "U")}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-slate-900">{msg.usernick || msg.userid || "Unbekannt"}</span>
                  <span className="text-xs text-slate-500">{formatTime(msg.time)}</span>
                </div>
                <p className="rounded-lg bg-white px-3 py-2 text-slate-800">{msg.text || "(kein Text)"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-3 py-2 lg:rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Nachricht ..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="flex-shrink-0 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "…" : "Senden"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BottomNav({
  activeTab,
  onTabChange,
  onLogout,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}) {
  return (
    <nav className="border-t border-slate-200 bg-white px-0 py-2 lg:hidden">
      <div className="flex items-center justify-around">
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={[
            "flex flex-col items-center gap-1 px-4 py-2",
            activeTab === "profile"
              ? "text-blue-600"
              : "text-slate-500",
          ].join(" ")}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-xs font-medium">Profil</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("chats")}
          className={[
            "relative flex flex-col items-center gap-1 px-4 py-2",
            activeTab === "chats"
              ? "text-blue-600"
              : "text-slate-500",
          ].join(" ")}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="text-xs font-medium">Chats</span>
          <span className="absolute right-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            2
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("settings")}
          className={[
            "flex flex-col items-center gap-1 px-4 py-2",
            activeTab === "settings"
              ? "text-blue-600"
              : "text-slate-500",
          ].join(" ")}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.34c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.81l-.31-2.15c-.05-.24-.24-.41-.48-.41h-3.26c-.24 0-.43.17-.49.41l-.31 2.15c-.54.21-1.02.49-1.44.81l-2.03-.81c-.22-.09-.47 0-.59.22l-1.63 2.83c-.1.17-.06.39.1.51l1.72 1.34c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.34c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.81l.31 2.15c.05.24.24.41.48.41h3.26c.24 0 .43-.17.49-.41l.31-2.15c.54-.21 1.02-.49 1.44-.81l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.1-.17.06-.39-.1-.51l-1.72-1.34zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
          <span className="text-xs font-medium">Einst.</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex flex-col items-center gap-1 px-4 py-2 text-slate-500 hover:text-red-600"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
          <span className="text-xs font-medium">Exit</span>
        </button>
      </div>
    </nav>
  );
}

export default function Chat() {
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState("chats");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    async function loadChats() {
      setLoadingChats(true);
      setError("");
      const result = await getChats(token);
      setLoadingChats(false);

      if (!result.ok || !result.data) {
        setError(result.error || "Chats konnten nicht geladen werden.");
        return;
      }

      setChats(result.data);
    }

    void loadChats();
  }, [navigate, token]);

  useEffect(() => {
    if (!token || !selectedChat) {
      return;
    }

    async function loadMessages() {
      setLoadingMessages(true);
      setError("");

      if (!selectedChat) {
        setLoadingMessages(false);
        return;
      }

      const result = await getMessages(token, selectedChat.chatid);
      setLoadingMessages(false);

      if (!result.ok || !result.data) {
        setError(result.error || "Nachrichten konnten nicht geladen werden.");
        return;
      }

      setMessages(result.data);
    }

    void loadMessages();
  }, [selectedChat, token]);

  async function handleSendMessage(text: string) {
    if (!token || !selectedChat) {
      return;
    }

    setSending(true);
    setError("");
    const result = await postTextMessage({
      token,
      text,
      chatid: selectedChat.chatid,
    });
    setSending(false);

    if (!result.ok) {
      setError(result.error || "Nachricht konnte nicht gesendet werden.");
      return;
    }

    const refreshed = await getMessages(token, selectedChat.chatid);
    if (refreshed.ok && refreshed.data) {
      setMessages(refreshed.data);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    navigate("/");
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 lg:grid lg:grid-cols-[320px_1fr]">
      {viewMode === "list" || window.innerWidth >= 1024 ? (
        <ChatListView
          chats={chats}
          selectedChatId={selectedChat?.chatid ?? null}
          onSelectChat={(id) => setSelectedChat(chats.find((c) => c.chatid === id) || null)}
          loadingChats={loadingChats}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
          onViewDetail={() => setViewMode("detail")}
        />
      ) : null}

      {viewMode === "detail" || window.innerWidth >= 1024 ? (
        <ChatDetailView
          chat={selectedChat}
          messages={messages}
          loading={loadingMessages}
          error={error}
          onBack={() => setViewMode("list")}
          onSendMessage={handleSendMessage}
          sending={sending}
        />
      ) : null}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
    </div>
  );
}
