import { useEffect, useMemo, useState } from "react";
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
import { toPngDataUrl } from "../utils/imageUtils";

type ViewMode = "list" | "detail" | "info";

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
    const result = await postMessage({ token, text, chatid: selectedChat.chatid, important });
    setSending(false);
    if (!result.ok) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, _status: "error" as const } : m));
      setError(result.error || "Nachricht konnte nicht gesendet werden.");
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
            onSendLocation={handleSendLocation}
            sending={sending}
          />
        ) : selectedChat ? (
          <ChatInfoView
            chat={selectedChat}
            messages={messages}
            onBack={() => setViewMode("detail")}
            onLeave={handleLeaveChat}
            onDelete={handleDeleteChat}
          />
        ) : null}
      </div>
    </div>
  );
}
