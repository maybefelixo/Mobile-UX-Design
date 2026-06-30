import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteChat,
  getChats,
  getMessages,
  leaveChat,
  postMessage,
  type ChatMessage,
  type ChatSummary,
} from "../services/chatApi";
import BottomNav from "../components/BottomNav";
import ChatListView, { type FilterType } from "../components/chat/ChatListView";
import ChatDetailView from "../components/chat/ChatDetailView";
import ChatInfoView from "../components/chat/ChatInfoView";
import { toBase64, toPngDataUrl } from "../utils/imageUtils";
import {
  addToOutbox,
  getChatsOffline,
  getMessagesOffline,
  saveChatsOffline,
  saveMessagesOffline,
} from "../utils/db";

type ViewMode = "list" | "detail" | "info";

const POLL_INTERVAL_MS = 2000;
const CHAT_LIST_POLL_MS = 15000;

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const openChatId = (location.state as { openChatId?: number } | null)?.openChatId ?? null;
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function goOnline() { setIsOffline(false); }
    function goOffline() { setIsOffline(true); }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  function handleSessionExpired() {
    localStorage.clear();
    setSessionExpired(true);
  }

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    async function loadChats() {
      setLoadingChats(true);
      const result = await getChats(token);
      setLoadingChats(false);
      if (result.ok && result.data) {
        setChats(result.data);
        void saveChatsOffline(result.data);
      } else if (result.invalidToken) {
        handleSessionExpired();
      } else {
        const offline = await getChatsOffline();
        if (offline.length > 0) setChats(offline as typeof chats);
        else setError(result.error || "Chats konnten nicht geladen werden.");
      }
    }
    void loadChats();
    const interval = setInterval(async () => {
      const result = await getChats(token);
      if (result.ok && result.data) setChats(result.data);
      else if (result.invalidToken) handleSessionExpired();
    }, CHAT_LIST_POLL_MS);
    return () => clearInterval(interval);
  }, [navigate, token]);

  useEffect(() => {
    if (!openChatId || chats.length === 0) return;
    const target = chats.find((c) => c.chatid === openChatId);
    if (target) { setSelectedChat(target); setViewMode("detail"); }
  }, [openChatId, chats]);

  useEffect(() => {
    if (!token || !selectedChat) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    const chatid = selectedChat.chatid;

    async function loadInitial() {
      setLoadingMessages(true);
      const result = await getMessages(token, chatid);
      setLoadingMessages(false);
      if (result.ok && result.data) {
        setMessages(result.data);
        void saveMessagesOffline(chatid, result.data);
      } else if (result.invalidToken) {
        handleSessionExpired();
      } else {
        const offline = await getMessagesOffline(chatid);
        if (offline.length > 0) setMessages(offline as ChatMessage[]);
        else setError(result.error || "Nachrichten konnten nicht geladen werden.");
      }
    }

    void loadInitial();

    pollingRef.current = setInterval(async () => {
      const result = await getMessages(token, chatid);
      if (result.ok && result.data) {
        setMessages((prev) => {
          const optimistic = prev.filter((m) => m._status !== undefined);
          return [...result.data!, ...optimistic];
        });
      } else if (result.invalidToken) {
        handleSessionExpired();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedChat?.chatid, token]);

  async function handleLeaveChat(): Promise<string | null> {
    if (!token || !selectedChat) return null;
    const result = await leaveChat(token, selectedChat.chatid);
    if (!result.ok) return result.error || "Chat konnte nicht verlassen werden.";
    setSelectedChat(null);
    setMessages([]);
    setViewMode("list");
    const refreshed = await getChats(token);
    if (refreshed.ok && refreshed.data) setChats(refreshed.data);
    return null;
  }

  async function handleDeleteChat(): Promise<string | null> {
    if (!token || !selectedChat) return null;
    const result = await deleteChat(token, selectedChat.chatid);
    if (!result.ok) return result.error || "Gruppe konnte nicht gelöscht werden.";
    setSelectedChat(null);
    setMessages([]);
    setViewMode("list");
    const refreshed = await getChats(token);
    if (refreshed.ok && refreshed.data) setChats(refreshed.data);
    return null;
  }

  async function handleSendMessage(text: string, important: boolean) {
    if (!token || !selectedChat) return;
    const tempId = Date.now();
    const optimistic: ChatMessage = {
      id: tempId,
      userid: localStorage.getItem("userid") || "",
      usernick: localStorage.getItem("nickname") || undefined,
      text,
      time: new Date().toISOString(),
      chatid: selectedChat.chatid,
      important,
      _status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    setError("");

    if (!navigator.onLine) {
      await addToOutbox({ token, chatid: selectedChat.chatid, text, important });
      if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((reg) => (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync?.register("sync-messages"))
          .catch(() => {});
      }
      setSending(false);
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
      );
      setError("Offline – Nachricht wird gesendet sobald du wieder online bist.");
      return;
    }

    const result = await postMessage({ token, text, chatid: selectedChat.chatid, important });
    setSending(false);
    if (!result.ok) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
      );
      setError(result.error || "Nachricht konnte nicht gesendet werden.");
      return;
    }
    setMessages((prev) =>
      prev.map((m) => m.id === tempId ? { ...m, _status: undefined } : m),
    );
  }

  async function handleSendPhoto(file: File) {
    if (!token || !selectedChat) return;
    const isImage = file.type.startsWith("image/");
    const tempId = Date.now();
    setSending(true);
    setError("");

    if (isImage) {
      let dataUrl: string;
      try { dataUrl = await toPngDataUrl(file); }
      catch { setError("Bild konnte nicht verarbeitet werden."); setSending(false); return; }
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
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      const result = await postMessage({ token, photo: base64, chatid: selectedChat.chatid });
      setSending(false);
      if (!result.ok) {
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
        );
        setError(result.error || "Foto konnte nicht gesendet werden.");
        return;
      }
    } else {
      let base64: string;
      try { base64 = await toBase64(file); }
      catch { setError("Datei konnte nicht verarbeitet werden."); setSending(false); return; }
      const optimistic: ChatMessage = {
        id: tempId,
        userid: localStorage.getItem("userid") || "",
        usernick: localStorage.getItem("nickname") || undefined,
        time: new Date().toISOString(),
        chatid: selectedChat.chatid,
        filename: file.name,
        mimetype: file.type,
        _status: "sending",
        _localFilePreview: `data:${file.type};base64,${base64}`,
      };
      setMessages((prev) => [...prev, optimistic]);
      const result = await postMessage({ token, file: base64, filename: file.name, mimetype: file.type, chatid: selectedChat.chatid });
      setSending(false);
      if (!result.ok) {
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
        );
        setError(result.error || "Datei konnte nicht gesendet werden.");
        return;
      }
    }

    setMessages((prev) =>
      prev.map((m) => m.id === tempId ? { ...m, _status: undefined } : m),
    );
  }

  async function handleSendFile(file: File) {
    if (!token || !selectedChat) return;
    const tempId = Date.now();
    setSending(true);
    setError("");
    let base64: string;
    try { base64 = await toBase64(file); }
    catch { setError("Datei konnte nicht verarbeitet werden."); setSending(false); return; }
    const isImg = file.type.startsWith("image/");
    const optimistic: ChatMessage = {
      id: tempId,
      userid: localStorage.getItem("userid") || "",
      usernick: localStorage.getItem("nickname") || undefined,
      time: new Date().toISOString(),
      chatid: selectedChat.chatid,
      filename: file.name,
      mimetype: file.type,
      _status: "sending",
      ...(isImg
        ? { _localPhotoPreview: `data:${file.type};base64,${base64}` }
        : { _localFilePreview: `data:${file.type};base64,${base64}` }),
    };
    setMessages((prev) => [...prev, optimistic]);
    const result = await postMessage({ token, file: base64, filename: file.name, mimetype: file.type, chatid: selectedChat.chatid });
    setSending(false);
    if (!result.ok) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
      );
      setError(result.error || "Datei konnte nicht gesendet werden.");
      return;
    }
    setMessages((prev) =>
      prev.map((m) => m.id === tempId ? { ...m, _status: undefined } : m),
    );
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
          setMessages((prev) =>
            prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m),
          );
          setError(result.error || "Standort konnte nicht gesendet werden.");
          return;
        }
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, _status: undefined } : m),
        );
      },
      () => setError("Standort konnte nicht ermittelt werden."),
    );
  }

  if (sessionExpired) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-8 text-center">
        <svg className="h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-lg font-semibold text-slate-800">Session abgelaufen</h2>
        <p className="text-sm text-slate-500">
          Deine Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-2 rounded-2xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white lg:grid lg:grid-cols-[360px_1fr]">
      {isOffline && (
        <div className="col-span-2 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-white">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 8.464a5 5 0 000 7.072M5.636 5.636a9 9 0 000 12.728" />
          </svg>
          Offline – Nachrichten werden synchronisiert sobald du wieder online bist
        </div>
      )}
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

      <div className={(viewMode === "detail" || viewMode === "info") ? "flex h-screen flex-col" : "hidden lg:flex lg:h-screen lg:flex-col"}>
        {viewMode !== "info" ? (
          <ChatDetailView
            token={token}
            chat={selectedChat}
            messages={messages}
            loading={loadingMessages}
            error={error}
            onBack={() => setViewMode("list")}
            onShowInfo={() => setViewMode("info")}
            onSendMessage={handleSendMessage}
            onSendPhoto={handleSendPhoto}
            onSendFile={handleSendFile}
            onSendLocation={handleSendLocation}
            sending={sending}
          />
        ) : selectedChat ? (
          <ChatInfoView
            chat={selectedChat}
            onBack={() => setViewMode("detail")}
            onLeave={handleLeaveChat}
            onDelete={handleDeleteChat}
          />
        ) : null}
      </div>
    </div>
  );
}
