import { type ChatSummary } from "../../services/chatApi";
import { avatarColor, getInitials } from "../../utils/avatarUtils";
import { formatTime } from "../../utils/dateUtils";

export type FilterType = "all" | "groups" | "direct" | "unread";

export default function ChatListView({
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
  const filtered = chats
    .filter((chat) => {
      if (filterType === "groups") return chat.visibility === "public";
      if (filterType === "direct") return chat.visibility !== "public";
      return true;
    })
    .filter((chat) => chat.chatname.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="bg-white px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-blue-600">Study Chat</h1>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Suchen"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3">
        {(["all", "direct", "groups", "unread"] as FilterType[]).map((type) => {
          const label = type === "all" ? "Alle" : type === "direct" ? "Direkt" : type === "groups" ? "Gruppen" : "Ungelesen";
          return (
            <button
              key={type}
              type="button"
              onClick={() => onFilterChange(type)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                filterType === type ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

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
              <div className={[
                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold text-white",
                avatarColor(chat.chatname),
              ].join(" ")}>
                {getInitials(chat.chatname)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-slate-900">{chat.chatname}</span>
                  <span className="ml-2 flex-shrink-0 text-xs text-slate-400">{formatTime(undefined)}</span>
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
