import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createChat, getProfiles, inviteUser, type UserProfile } from "../services/chatApi";
import BottomNav from "../components/BottomNav";

const AVATAR_COLORS = [
  "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-purple-500",
  "bg-indigo-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500",
  "bg-emerald-500", "bg-green-500", "bg-amber-500", "bg-orange-500",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function ContactAvatar({ name }: { name: string }) {
  return (
    <div className={[
      "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
      avatarColor(name),
    ].join(" ")}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function EmptyState({ text = "Keine Kontakte gefunden." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

type Tab = "dm" | "group";

export default function Profile() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [tab, setTab] = useState<Tab>("dm");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // DM flow
  const [creatingDm, setCreatingDm] = useState<string | null>(null);

  // Group flow
  const [groupName, setGroupName] = useState("");
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    setLoadingProfiles(true);
    getProfiles(token).then((result) => {
      setLoadingProfiles(false);
      if (result.ok && result.data) setProfiles(result.data);
    });
  }, [token, navigate]);

  // Reset search when switching tabs
  useEffect(() => { setSearch(""); }, [tab]);

  const filtered = useMemo(() =>
    profiles
      .filter((p) => p.nickname.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.nickname.localeCompare(b.nickname, "de")),
    [profiles, search],
  );

// --- DM flow ---
  async function handleStartDm(profile: UserProfile) {
    setCreatingDm(profile.hash);
    const result = await createChat({ token, chatname: profile.nickname });
    if (result.ok && result.data) {
      await inviteUser(token, result.data, profile.hash);
    }
    setCreatingDm(null);
    navigate("/chat");
  }

  // --- Group flow ---
  function toggleContact(hash: string) {
    setSelectedHashes((prev) => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || selectedHashes.size === 0) return;
    setCreatingGroup(true);
    setGroupError("");
    const result = await createChat({ token, chatname: groupName.trim() });
    if (!result.ok || !result.data) {
      setGroupError(result.error || "Fehler beim Erstellen.");
      setCreatingGroup(false);
      return;
    }
    const chatid = result.data;
    await Promise.all(
      Array.from(selectedHashes).map((hash) => inviteUser(token, chatid, hash)),
    );
    setCreatingGroup(false);
    setGroupName("");
    setSelectedHashes(new Set());
    navigate("/chat");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "dm", label: "Neue Nachricht" },
    { key: "group", label: "Neue Gruppe" },
  ];

  return (
    <div className="flex h-screen flex-col bg-slate-50">

      {/* Header + sub-tab bar + search */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-slate-900">Kontakte</h1>
        </div>

        <div className="mt-3 flex border-b border-slate-200">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "flex-1 pb-3 text-xs font-semibold transition-colors",
                tab === key
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search ? (
              <button type="button" onClick={() => setSearch("")} className="text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {loadingProfiles ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Laden…</p>
          </div>

        ) : tab === "dm" ? (
          /* ── Direktnachricht ─────────────────────────────────── */
          filtered.length === 0 ? <EmptyState /> : (
            <>
              <p className="px-4 py-2 text-xs text-slate-400">
                Tippe auf einen Kontakt, um eine neue Direktnachricht zu starten.
                Die Person muss die Einladung noch annehmen, bevor sie antworten kann.
              </p>
              <div className="divide-y divide-slate-100 bg-white">
                {filtered.map((profile) => (
                  <button
                    key={profile.hash}
                    type="button"
                    onClick={() => handleStartDm(profile)}
                    disabled={!!creatingDm}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
                  >
                    <ContactAvatar name={profile.nickname} />
                    <p className="flex-1 text-left text-sm font-medium text-slate-900">
                      {profile.nickname}
                    </p>
                    {creatingDm === profile.hash ? (
                      <span className="text-xs text-slate-400">Erstelle…</span>
                    ) : (
                      <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )

        ) : tab === "group" ? (
          /* ── Neue Gruppe ─────────────────────────────────────── */
          <div className="flex flex-col gap-4 p-4">

            {/* Group name */}
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="px-4 py-3">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Gruppenname
                </p>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Name der Gruppe…"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Selection hint */}
            <p className="px-1 text-xs text-slate-400">
              {selectedHashes.size === 0
                ? "Mindestens einen Kontakt auswählen."
                : `${selectedHashes.size} Mitglied${selectedHashes.size !== 1 ? "er" : ""} ausgewählt`}
            </p>

            {/* Selectable contact list */}
            {filtered.length === 0 ? <EmptyState /> : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
                {filtered.map((profile) => {
                  const selected = selectedHashes.has(profile.hash);
                  return (
                    <button
                      key={profile.hash}
                      type="button"
                      onClick={() => toggleContact(profile.hash)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100"
                    >
                      <ContactAvatar name={profile.nickname} />
                      <p className="flex-1 text-left text-sm font-medium text-slate-900">
                        {profile.nickname}
                      </p>
                      {/* Circle checkbox */}
                      <div className={[
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white",
                      ].join(" ")}>
                        {selected ? (
                          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {groupError ? (
              <p className="text-center text-sm text-red-600">{groupError}</p>
            ) : null}

            {/* Create button */}
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedHashes.size === 0 || creatingGroup}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40"
            >
              {creatingGroup
                ? "Erstelle Gruppe…"
                : `Gruppe erstellen${selectedHashes.size > 0 ? ` (${selectedHashes.size})` : ""}`}
            </button>
          </div>

        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}