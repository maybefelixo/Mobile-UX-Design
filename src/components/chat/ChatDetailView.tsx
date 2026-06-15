import { useEffect, useMemo, useRef, useState } from "react";
import { type ChatMessage, type ChatSummary } from "../../services/chatApi";
import { avatarColor, getInitials } from "../../utils/avatarUtils";
import { formatDateSeparator, formatMsgTime, isSameDay } from "../../utils/dateUtils";
import LocationMessage from "./LocationMessage";
import MessageStatus from "./MessageStatus";
import PhotoMessage from "./PhotoMessage";

export default function ChatDetailView({
  token, chat, messages, loading, error, onBack, onShowInfo,
  onSendMessage, onSendPhoto, onSendLocation, sending,
}: {
  token: string;
  chat: ChatSummary | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onShowInfo: () => void;
  onSendMessage: (text: string, important: boolean) => Promise<void>;
  onSendPhoto: (file: File) => Promise<void>;
  onSendLocation: () => Promise<void>;
  sending: boolean;
}) {
  const [messageText, setMessageText] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [important, setImportant] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const myUserid = useMemo(() => localStorage.getItem("userid") || "", []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!messageText.trim()) return;
    await onSendMessage(messageText, important);
    setMessageText("");
    setImportant(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setMediaOpen(false);
    await onSendPhoto(file);
  }

  async function handleLocationPick() {
    setMediaOpen(false);
    await onSendLocation();
  }

  const chatName = chat?.chatname || "Chat";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 pb-3 pt-12 shadow-sm">
        <button type="button" onClick={onBack} className="mr-1 text-blue-600 lg:hidden">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button type="button" onClick={onShowInfo} className="flex flex-1 min-w-0 items-center gap-3 text-left">
          <div className={[
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
            avatarColor(chatName),
          ].join(" ")}>
            {getInitials(chatName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 leading-tight">{chatName}</p>
            <p className="text-xs text-slate-400">
              {chat ? (chat.directchat ? "Direktnachricht" : "Gruppe") : ""}
            </p>
          </div>
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
            const isPhoto = !!(msg.photoid || msg._localPhotoPreview);
            const isLocation = !!msg.position && !isPhoto;

            return (
              <div key={`${msg.id}-${i}`}>
                {showDate ? (
                  <div className="flex items-center justify-center py-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-500">
                      {formatDateSeparator(msg.time)}
                    </span>
                  </div>
                ) : null}

                <div className={["flex items-end gap-2 mb-1", isOwn ? "flex-row-reverse" : "flex-row"].join(" ")}>
                  {!isOwn ? (
                    <div className={[
                      "mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                      avatarColor(senderName),
                    ].join(" ")}>
                      {getInitials(senderName)}
                    </div>
                  ) : <div className="w-8 flex-shrink-0" />}

                  <div className={["max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start"].join(" ")}>
                    {!isOwn ? (
                      <span className="mb-1 ml-1 text-xs font-medium text-slate-500">{senderName}</span>
                    ) : null}

                    <div className={[
                      isPhoto ? "" : "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      !isPhoto && isOwn ? "rounded-br-sm bg-blue-600 text-white" : "",
                      !isPhoto && !isOwn ? "rounded-bl-sm bg-white text-slate-800" : "",
                      msg.important ? "ring-[3px] ring-red-500" : "",
                    ].join(" ")}>
                      {isPhoto
                        ? <PhotoMessage token={token} photoid={msg.photoid} localPreview={msg._localPhotoPreview} />
                        : isLocation
                        ? <LocationMessage position={msg.position!} isOwn={isOwn} />
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

      {/* Media picker */}
      {mediaOpen && (
        <div className="flex gap-6 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={handleLocationPick} disabled={sending} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-7 w-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-600">Standort</span>
          </button>
          <button type="button" onClick={() => { fileInputRef.current?.click(); setMediaOpen(false); }} disabled={sending} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-600">Foto</span>
          </button>
          <button type="button" onClick={() => { cameraInputRef.current?.click(); setMediaOpen(false); }} disabled={sending} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-600">Kamera</span>
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white px-3 py-3 shadow-lg">
        <button
          type="button"
          onClick={() => setMediaOpen((v) => !v)}
          className={["flex-shrink-0 transition-colors", mediaOpen ? "text-blue-600" : "text-slate-400 hover:text-slate-600"].join(" ")}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setImportant((v) => !v)}
          title="Als wichtig markieren"
          className={["flex-shrink-0 transition-colors", important ? "text-red-500" : "text-slate-400 hover:text-slate-600"].join(" ")}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Nachricht…"
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
