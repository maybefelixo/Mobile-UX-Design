import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deregisterUser, logoutUser } from "../services/authApi";
import { getInvites, joinChat, type ChatInvite } from "../services/chatApi";
import BottomNav from "../components/BottomNav";

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const userid = localStorage.getItem("userid") || "";
  const nickname = localStorage.getItem("nickname") || "";
  const fullname = localStorage.getItem("fullname") || "";
  const myHash = localStorage.getItem("hash") || "";

  const [loading, setLoading] = useState(false);
  const [confirmDeregister, setConfirmDeregister] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<ChatInvite[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [hashCopied, setHashCopied] = useState(false);

  const displayName = nickname || userid || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!token) return;
    getInvites(token).then((result) => {
      if (result.ok && result.data) setInvites(result.data);
    });
  }, [token]);

  async function handleCopyHash() {
    await navigator.clipboard.writeText(myHash);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  }

  async function handleJoin(chatid: number) {
    setJoiningId(chatid);
    const result = await joinChat(token, chatid);
    if (result.ok) {
      setInvites((prev) => prev.filter((i) => i.chatid !== chatid));
    }
    setJoiningId(null);
  }

  async function handleLogout() {
    setLoading(true);
    await logoutUser(token);
    localStorage.clear();
    navigate("/");
  }

  async function handleDeregister() {
    setLoading(true);
    const result = await deregisterUser(token);
    if (result.ok) {
      localStorage.clear();
      navigate("/");
    } else {
      setLoading(false);
      setError(result.error || "Fehler beim Löschen.");
      setConfirmDeregister(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="bg-white px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Einstellungen</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-4xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <p className="text-xl font-semibold text-slate-900">{displayName}</p>
          {fullname && nickname ? (
            <p className="text-sm text-slate-500">{fullname}</p>
          ) : null}
        </div>

        {/* Info card */}
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          {userid ? (
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">User ID</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{userid}</p>
            </div>
          ) : null}
          {nickname ? (
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nickname</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{nickname}</p>
            </div>
          ) : null}
          {fullname ? (
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{fullname}</p>
            </div>
          ) : null}
          {myHash ? (
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mein Hash</p>
              <p className="text-xs text-slate-400 mb-1">Teile ihn, damit andere dich in Chats einladen können.</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 break-all font-mono text-xs text-slate-700">{myHash}</p>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex-shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  {hashCopied ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Invitations */}
        {invites.length > 0 ? (
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Einladungen</p>
            </div>
            <div className="divide-y divide-slate-100">
              {invites.map((invite) => (
                <div key={invite.chatid} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {invite.chatname.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-900">{invite.chatname}</p>
                  <button
                    type="button"
                    onClick={() => handleJoin(invite.chatid)}
                    disabled={joiningId === invite.chatid}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {joiningId === invite.chatid ? "…" : "Beitreten"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* App info */}
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Version</p>
            <p className="mt-0.5 text-sm text-slate-900">1.0.0</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">API</p>
            <p className="mt-0.5 text-xs text-slate-500 break-all">https://www2.hs-esslingen.de/~nitzsche/api/</p>
          </div>
        </div>

        {error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && !confirmDeregister ? "Abmelden…" : "Abmelden"}
          </button>

          {!confirmDeregister ? (
            <button
              type="button"
              onClick={() => { setConfirmDeregister(true); setError(""); }}
              className="w-full rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Account löschen
            </button>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="font-semibold text-red-700">Account wirklich löschen?</p>
              <p className="text-xs text-red-600">
                Diese Aktion ist nicht rückgängig zu machen. Dein Account und alle Daten werden dauerhaft entfernt.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeregister}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-red-700"
                >
                  {loading ? "Lösche…" : "Ja, löschen"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeregister(false)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}