import { useState } from "react";
import { type ChatSummary } from "../../services/chatApi";
import { avatarColor, getInitials } from "../../utils/avatarUtils";

export default function ChatInfoView({
  chat, onBack, onLeave, onDelete,
}: {
  chat: ChatSummary;
  onBack: () => void;
  onLeave: () => Promise<string | null>;
  onDelete: () => Promise<string | null>;
}) {
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");

  const isGroup = !chat.directchat;
  const isOwner = chat.role === "owner" || chat.role === "admin";

  async function handleLeave() {
    setLeaving(true);
    setActionError("");
    const err = await onLeave();
    setLeaving(false);
    if (err) setActionError(err);
  }

  async function handleDelete() {
    setDeleting(true);
    setActionError("");
    const err = await onDelete();
    setDeleting(false);
    if (err) { setActionError(err); setConfirmDelete(false); }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <div className="flex items-center gap-3 bg-white px-4 pb-3 pt-12 shadow-sm">
        <button type="button" onClick={onBack} className="mr-1 text-blue-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 font-semibold text-slate-900">
          {isGroup ? "Gruppeninfo" : "Kontaktinfo"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center bg-white px-4 py-10">
          <div className={[
            "flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white",
            avatarColor(chat.chatname),
          ].join(" ")}>
            {getInitials(chat.chatname)}
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">{chat.chatname}</h2>
          <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {isGroup
              ? chat.visibility === "public" ? "Öffentliche Gruppe" : "Private Gruppe"
              : "Direktnachricht"}
          </span>
          {chat.owner ? (
            <p className="mt-2 text-xs text-slate-400">
              Erstellt von <span className="font-medium text-slate-600">{chat.owner.nickname}</span>
            </p>
          ) : null}
        </div>

        {/* Participants */}
        <div className="mt-4">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Mitglieder ({chat.participants.length})
          </p>
          <div className="divide-y divide-slate-100 bg-white">
            {chat.participants.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400">Keine Mitglieder gefunden.</p>
            ) : (
              chat.participants
                .slice()
                .sort((a, b) => a.nickname.localeCompare(b.nickname, "de"))
                .map((p) => (
                  <div key={p.hash} className="flex items-center gap-3 px-4 py-3">
                    <div className={[
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                      avatarColor(p.nickname),
                    ].join(" ")}>
                      {getInitials(p.nickname)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{p.nickname}</p>
                      {p.fullname ? (
                        <p className="text-xs text-slate-400 truncate">{p.fullname}</p>
                      ) : null}
                    </div>
                    {chat.owner?.hash === p.hash ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Owner
                      </span>
                    ) : null}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Invited (pending) */}
        {chat.invited.length > 0 ? (
          <div className="mt-4">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Eingeladen ({chat.invited.length})
            </p>
            <div className="divide-y divide-slate-100 bg-white">
              {chat.invited
                .slice()
                .sort((a, b) => a.nickname.localeCompare(b.nickname, "de"))
                .map((p) => (
                  <div key={p.hash} className="flex items-center gap-3 px-4 py-3">
                    <div className={[
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white opacity-60",
                      avatarColor(p.nickname),
                    ].join(" ")}>
                      {getInitials(p.nickname)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-500">{p.nickname}</p>
                      {p.fullname ? (
                        <p className="text-xs text-slate-400 truncate">{p.fullname}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Ausstehend
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 divide-y divide-slate-100 bg-white">
          {actionError ? <p className="px-4 py-3 text-sm text-red-600">{actionError}</p> : null}

          {!isOwner && (
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving || deleting}
              className="flex w-full items-center gap-3 px-4 py-4 text-red-600 disabled:opacity-50"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              <span className="text-sm font-medium">{leaving ? "Verlasse…" : "Chat verlassen"}</span>
            </button>
          )}

          {isOwner && (
            confirmDelete ? (
              <div className="flex gap-3 px-4 py-4">
                <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {deleting ? "Lösche…" : "Ja, löschen"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600">
                  Abbrechen
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} className="flex w-full items-center gap-3 px-4 py-4 text-red-700 disabled:opacity-50">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium">{isGroup ? "Gruppe löschen" : "Chat löschen"}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
