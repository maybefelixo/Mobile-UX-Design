import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createChat,
  getChats,
  getInvites,
  getProfiles,
  inviteUser,
  joinChat,
  rejectInvite,
  type ChatInvite,
  type ChatSummary,
  type UserProfile,
} from "../services/chatApi";
import BottomNav from "../components/BottomNav";
import { avatarColor, getInitials } from "../utils/avatarUtils";

type Tab = "dm" | "group" | "discover" | "invites";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div className={[
      "flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white",
      avatarColor(name), sz,
    ].join(" ")}>
      {getInitials(name)}
    </div>
  );
}

function SearchBar({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
      <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} className="text-slate-400 hover:text-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200",
        value ? "bg-blue-600" : "bg-slate-200",
      ].join(" ")}
    >
      <div className={[
        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
        value ? "translate-x-5" : "translate-x-0.5",
      ].join(" ")} />
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [tab, setTab] = useState<Tab>("dm");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [dmSearch, setDmSearch] = useState("");
  const [creatingDm, setCreatingDm] = useState<string | null>(null);

  const [groupName, setGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [groupSearch, setGroupSearch] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  const [publicChats, setPublicChats] = useState<ChatSummary[]>([]);
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState("");

  const [invites, setInvites] = useState<ChatInvite[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    setLoading(true);
    Promise.all([getProfiles(token), getChats(token), getInvites(token)]).then(([profilesRes, chatsRes, invitesRes]) => {
      setLoading(false);
      if (profilesRes.ok && profilesRes.data) setProfiles(profilesRes.data);
      if (chatsRes.ok && chatsRes.data) {
        setPublicChats(chatsRes.data.filter((c) => c.visibility === "public"));
      }
      if (invitesRes.ok && invitesRes.data) setInvites(invitesRes.data);
    });
  }, [token, navigate]);

  const dmFiltered = useMemo(() =>
    profiles
      .filter((p) =>
        p.nickname.toLowerCase().includes(dmSearch.toLowerCase()) ||
        p.fullname.toLowerCase().includes(dmSearch.toLowerCase()),
      )
      .sort((a, b) => a.nickname.localeCompare(b.nickname, "de")),
    [profiles, dmSearch],
  );

  const groupFiltered = useMemo(() =>
    profiles
      .filter((p) =>
        p.nickname.toLowerCase().includes(groupSearch.toLowerCase()) ||
        p.fullname.toLowerCase().includes(groupSearch.toLowerCase()),
      )
      .sort((a, b) => a.nickname.localeCompare(b.nickname, "de")),
    [profiles, groupSearch],
  );

  const discoverFiltered = useMemo(() =>
    publicChats
      .filter((c) => c.chatname.toLowerCase().includes(discoverSearch.toLowerCase()))
      .sort((a, b) => a.chatname.localeCompare(b.chatname, "de")),
    [publicChats, discoverSearch],
  );

  async function handleStartDm(profile: UserProfile) {
    setCreatingDm(profile.hash);
    const result = await createChat({ token, chatname: profile.nickname, directchat: true });
    if (result.ok && result.data) {
      await inviteUser(token, result.data, profile.hash);
      setCreatingDm(null);
      navigate("/chat", { state: { openChatId: result.data } });
    } else {
      setCreatingDm(null);
      navigate("/chat");
    }
  }

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
    const result = await createChat({ token, chatname: groupName.trim(), ispublic: isPublic });
    if (!result.ok || !result.data) {
      setGroupError(result.error || "Fehler beim Erstellen.");
      setCreatingGroup(false);
      return;
    }
    const chatid = result.data;
    await Promise.all(Array.from(selectedHashes).map((hash) => inviteUser(token, chatid, hash)));
    setCreatingGroup(false);
    setGroupName("");
    setIsPublic(false);
    setSelectedHashes(new Set());
    navigate("/chat", { state: { openChatId: chatid } });
  }

  async function handleJoin(chatid: number) {
    setJoiningId(chatid);
    setJoinError("");
    const result = await joinChat(token, chatid);
    if (!result.ok) {
      setJoinError(result.error || "Beitreten fehlgeschlagen.");
      setJoiningId(null);
      return;
    }
    setPublicChats((prev) => prev.map((c) => c.chatid === chatid ? { ...c, joined: true } : c));
    setJoiningId(null);
  }

  async function handleAcceptInvite(chatid: number) {
    setAcceptingId(chatid);
    setInviteError("");
    const result = await joinChat(token, chatid);
    if (!result.ok) {
      setInviteError(result.error || "Einladung konnte nicht angenommen werden.");
      setAcceptingId(null);
      return;
    }
    setInvites((prev) => prev.filter((i) => i.chatid !== chatid));
    setAcceptingId(null);
    navigate("/chat", { state: { openChatId: chatid } });
  }

  async function handleRejectInvite(chatid: number) {
    setRejectingId(chatid);
    setInviteError("");
    const result = await rejectInvite(token, chatid);
    if (!result.ok) {
      setInviteError(result.error || "Einladung konnte nicht abgelehnt werden.");
      setRejectingId(null);
      return;
    }
    setInvites((prev) => prev.filter((i) => i.chatid !== chatid));
    setRejectingId(null);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "dm",
      label: "Nachricht",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      key: "group",
      label: "Gruppe",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: "discover",
      label: "Entdecken",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "invites",
      label: "Einladungen",
      icon: (
        <div className="relative">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {invites.length > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {invites.length > 9 ? "9+" : invites.length}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  const tabTitles: Record<Tab, string> = {
    dm: "Neue Nachricht",
    group: "Neue Gruppe",
    discover: "Gruppen entdecken",
    invites: "Einladungen",
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-12 pb-0">
          <h1 className="text-xl font-bold text-slate-900">{tabTitles[tab]}</h1>
        </div>

        {/* Tab bar with icons */}
        <div className="mt-3 flex border-b border-slate-200">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "flex flex-1 flex-col items-center gap-1 pb-3 pt-2 text-xs font-semibold transition-colors",
                tab === key
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-400 hover:text-slate-600",
              ].join(" ")}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Laden…</p>
          </div>

        ) : tab === "dm" ? (
          /* ── Tab: Neue Direktnachricht ── */
          <div className="flex flex-col">
            <div className="px-4 pt-4 pb-3">
              <SearchBar value={dmSearch} onChange={setDmSearch} placeholder="Kontakt suchen…" />
            </div>

            {dmFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-slate-400">Keine Kontakte gefunden.</p>
              </div>
            ) : (
              <>
                <p className="px-4 pb-2 text-xs text-slate-400">
                  {profiles.length} {profiles.length === 1 ? "Kontakt" : "Kontakte"} · Tippe, um eine Direktnachricht zu starten
                </p>
                <div className="divide-y divide-slate-100 bg-white">
                  {dmFiltered.map((profile) => (
                    <button
                      key={profile.hash}
                      type="button"
                      onClick={() => handleStartDm(profile)}
                      disabled={!!creatingDm}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
                    >
                      <Avatar name={profile.nickname} />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-slate-900">{profile.nickname}</p>
                        {profile.fullname ? (
                          <p className="text-xs text-slate-400 truncate">{profile.fullname}</p>
                        ) : null}
                      </div>
                      {creatingDm === profile.hash ? (
                        <span className="flex-shrink-0 text-xs text-slate-400">Erstelle…</span>
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        ) : tab === "group" ? (
          /* ── Tab: Neue Gruppe ── */
          <div className="flex flex-col gap-4 p-4 pb-24">

            {/* Step 1: Group settings */}
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                1 · Gruppendetails
              </p>
              <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Gruppenname eingeben…"
                    className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {isPublic ? "Öffentlich" : "Privat"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isPublic ? "Jeder kann die Gruppe finden und beitreten" : "Nur per Einladung beitreten"}
                    </p>
                  </div>
                  <Toggle value={isPublic} onChange={setIsPublic} />
                </div>
              </div>
            </div>

            {/* Step 2: Members */}
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                2 · Mitglieder einladen
                {selectedHashes.size > 0 ? (
                  <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-white">
                    {selectedHashes.size}
                  </span>
                ) : null}
              </p>

              {/* Selected chips */}
              {selectedHashes.size > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {profiles
                    .filter((p) => selectedHashes.has(p.hash))
                    .map((p) => (
                      <button
                        key={p.hash}
                        type="button"
                        onClick={() => toggleContact(p.hash)}
                        className="flex items-center gap-1.5 rounded-full bg-blue-100 pl-1 pr-2.5 py-1 text-xs font-medium text-blue-800"
                      >
                        <Avatar name={p.nickname} size="sm" />
                        {p.nickname}
                        <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ))}
                </div>
              ) : (
                <p className="mb-3 px-1 text-xs text-slate-400">
                  Mindestens einen Kontakt auswählen.
                </p>
              )}

              <div className="mb-3">
                <SearchBar value={groupSearch} onChange={setGroupSearch} placeholder="Kontakt suchen…" />
              </div>

              {groupFiltered.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Keine Kontakte gefunden.</p>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
                  {groupFiltered.map((profile) => {
                    const selected = selectedHashes.has(profile.hash);
                    return (
                      <button
                        key={profile.hash}
                        type="button"
                        onClick={() => toggleContact(profile.hash)}
                        className={[
                          "flex w-full items-center gap-3 px-4 py-3 transition-colors",
                          selected ? "bg-blue-50" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <Avatar name={profile.nickname} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-slate-900">{profile.nickname}</p>
                          {profile.fullname ? (
                            <p className="text-xs text-slate-400 truncate">{profile.fullname}</p>
                          ) : null}
                        </div>
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
            </div>

            {groupError ? (
              <p className="text-center text-sm text-red-600">{groupError}</p>
            ) : null}
          </div>

        ) : tab === "invites" ? (
          /* ── Tab: Einladungen ── */
          <div className="flex flex-col">
            {inviteError ? (
              <p className="px-4 pt-4 text-sm text-red-600">{inviteError}</p>
            ) : null}

            {invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-400">Keine offenen Einladungen.</p>
              </div>
            ) : (
              <>
                <p className="px-4 pt-4 pb-2 text-xs text-slate-400">
                  {invites.length} offene {invites.length === 1 ? "Einladung" : "Einladungen"}
                </p>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  {invites.map((invite) => (
                    <div key={invite.chatid} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-4">
                        <div className={[
                          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold text-white",
                          avatarColor(invite.chatname),
                        ].join(" ")}>
                          {getInitials(invite.chatname)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{invite.chatname}</p>
                          {invite.owner ? (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Eingeladen von{" "}
                              <span className="font-medium text-slate-600">{invite.owner.nickname}</span>
                              {invite.owner.fullname ? ` (${invite.owner.fullname})` : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                        <button
                          type="button"
                          onClick={() => handleRejectInvite(invite.chatid)}
                          disabled={acceptingId !== null || rejectingId !== null}
                          className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          {rejectingId === invite.chatid ? "Ablehne…" : "Ablehnen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(invite.chatid)}
                          disabled={acceptingId !== null || rejectingId !== null}
                          className="flex-1 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                        >
                          {acceptingId === invite.chatid ? "Trete bei…" : "Annehmen"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        ) : (
          /* ── Tab: Gruppen entdecken ── */
          <div className="flex flex-col">
            <div className="px-4 pt-4 pb-3">
              <SearchBar value={discoverSearch} onChange={setDiscoverSearch} placeholder="Gruppe suchen…" />
            </div>

            {joinError ? (
              <p className="px-4 pb-2 text-sm text-red-600">{joinError}</p>
            ) : null}

            {discoverFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">Keine öffentlichen Gruppen gefunden.</p>
              </div>
            ) : (
              <>
                <p className="px-4 pb-2 text-xs text-slate-400">
                  {discoverFiltered.length} öffentliche {discoverFiltered.length === 1 ? "Gruppe" : "Gruppen"}
                </p>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  {discoverFiltered.map((chat) => (
                    <div
                      key={chat.chatid}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <div className={[
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold text-white",
                        avatarColor(chat.chatname),
                      ].join(" ")}>
                        {getInitials(chat.chatname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{chat.chatname}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          {chat.owner ? (
                            <span>von {chat.owner.nickname}</span>
                          ) : null}
                          {chat.owner && chat.participants.length > 0 ? (
                            <span className="text-slate-300">·</span>
                          ) : null}
                          {chat.participants.length > 0 ? (
                            <span>{chat.participants.length} {chat.participants.length === 1 ? "Mitglied" : "Mitglieder"}</span>
                          ) : null}
                        </div>
                      </div>
                      {chat.joined ? (
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Mitglied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoin(chat.chatid)}
                          disabled={joiningId !== null}
                          className="flex-shrink-0 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {joiningId === chat.chatid ? "…" : "Beitreten"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky create button for group tab */}
      {tab === "group" ? (
        <div className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg">
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedHashes.size === 0 || creatingGroup}
            className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-opacity"
          >
            {creatingGroup
              ? "Erstelle Gruppe…"
              : selectedHashes.size > 0
              ? `Gruppe erstellen mit ${selectedHashes.size} ${selectedHashes.size === 1 ? "Mitglied" : "Mitgliedern"}`
              : "Gruppe erstellen"}
          </button>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
