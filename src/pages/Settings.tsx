import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deregisterUser, logoutUser } from "../services/authApi";
import BottomNav from "../components/BottomNav";

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const userid = localStorage.getItem("userid") || "";
  const nickname = localStorage.getItem("nickname") || "";
  const fullname = localStorage.getItem("fullname") || "";

  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [loading, setLoading] = useState(false);
  const [confirmDeregister, setConfirmDeregister] = useState(false);
  const [error, setError] = useState("");

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  const displayName = nickname || userid || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

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
        </div>

        {/* Dark mode toggle */}
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm font-medium text-slate-900">Dark Mode</span>
            </div>
            <div className={["relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200", darkMode ? "bg-blue-600" : "bg-slate-200"].join(" ")}>
              <div className={["absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200", darkMode ? "translate-x-5" : "translate-x-0.5"].join(" ")} />
            </div>
          </button>
        </div>

        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

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
