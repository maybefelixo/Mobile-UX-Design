import { useState } from "react";
import * as authApi from "../services/authApi";
import * as chatApi from "../services/chatApi";

type AnyResult = { ok: boolean; data?: unknown; error?: string };

function Row({
  label,
  result,
  children,
}: {
  label: string;
  result: AnyResult | undefined;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 shrink-0 font-bold">{label}</span>
        {children}
      </div>
      {result && (
        <pre
          className={`max-h-40 overflow-auto rounded p-2 text-xs ${
            result.ok
              ? "border border-green-300 bg-green-50"
              : "border border-red-300 bg-red-50"
          }`}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Debug() {
  const [token, setToken] = useState(localStorage.getItem("token") ?? "");
  const [results, setResults] = useState<Record<string, AnyResult>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Auth inputs
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");

  // Chat inputs
  const [chatid, setChatid] = useState("");
  const [chatname, setChatname] = useState("");
  const [ispublic, setIspublic] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [fromid, setFromid] = useState("");
  const [invitedhash, setInvitedhash] = useState("");
  const [photoid, setPhotoid] = useState("");
  const [important, setImportant] = useState(false);

  const set = (key: string, result: AnyResult) =>
    setResults((prev) => ({ ...prev, [key]: result }));

  const inp =
    "rounded border p-1 text-sm";
  const btn =
    "rounded px-2 py-1 text-sm text-white";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 font-mono text-sm">
      <h1 className="text-2xl font-bold">API Debug</h1>

      {/* Shared token */}
      <div className="flex items-center gap-2">
        <span className="font-bold">Token:</span>
        <input
          className={`${inp} flex-1`}
          placeholder="login or register to get a token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button
          className={`${btn} bg-gray-400`}
          onClick={() => setToken(localStorage.getItem("token") ?? "")}
        >
          from localStorage
        </button>
      </div>

      {/* ── AUTH ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="border-b text-lg font-bold">Auth</h2>

        <Row label="register" result={results.register}>
          <input className={`${inp} w-24`} placeholder="userid" value={userid} onChange={(e) => setUserid(e.target.value)} />
          <input className={`${inp} w-24`} placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className={`${inp} w-24`} placeholder="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <input className={`${inp} w-28`} placeholder="fullname" value={fullname} onChange={(e) => setFullname(e.target.value)} />
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () => {
              const r = await authApi.registerUser({ userid, password, nickname, fullname });
              if (r.ok && typeof r.data === "string") setToken(r.data);
              set("register", r);
            }}
          >
            Call
          </button>
        </Row>

        <Row label="login" result={results.login}>
          <input className={`${inp} w-24`} placeholder="userid" value={userid} onChange={(e) => setUserid(e.target.value)} />
          <input className={`${inp} w-24`} placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () => {
              const r = await authApi.loginUser({ userid, password });
              if (r.ok && typeof r.data === "string") setToken(r.data);
              set("login", r);
            }}
          >
            Call
          </button>
        </Row>

        <Row label="validatetoken" result={results.validatetoken}>
          <button className={`${btn} bg-blue-500`} onClick={async () => set("validatetoken", await authApi.validateToken(token))}>Call</button>
        </Row>

        <Row label="logout" result={results.logout}>
          <button className={`${btn} bg-blue-500`} onClick={async () => set("logout", await authApi.logoutUser(token))}>Call</button>
        </Row>

        <Row label="deregister" result={results.deregister}>
          <span className="text-xs text-red-500">deletes your account!</span>
          <button className={`${btn} bg-red-500`} onClick={async () => set("deregister", await authApi.deregisterUser(token))}>Call</button>
        </Row>
      </section>

      {/* ── CHAT ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="border-b text-lg font-bold">Chat</h2>

        <Row label="getchats" result={results.getchats}>
          <button className={`${btn} bg-blue-500`} onClick={async () => set("getchats", await chatApi.getChats(token))}>Call</button>
        </Row>

        <Row label="getmessages" result={results.getmessages}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <input className={`${inp} w-20`} placeholder="fromid" value={fromid} onChange={(e) => setFromid(e.target.value)} />
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () =>
              set("getmessages", await chatApi.getMessages(
                token,
                chatid ? Number(chatid) : undefined,
                fromid ? Number(fromid) : undefined,
              ))
            }
          >
            Call
          </button>
        </Row>

        <Row label="postmessage" result={results.postmessage}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <input className={`${inp} flex-1`} placeholder="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            important
          </label>
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () =>
              set("postmessage", await chatApi.postMessage({
                token,
                text: msgText || undefined,
                chatid: chatid ? Number(chatid) : undefined,
                important: important || undefined,
              }))
            }
          >
            Call
          </button>
        </Row>

        <Row label="getprofiles" result={results.getprofiles}>
          <button className={`${btn} bg-blue-500`} onClick={async () => set("getprofiles", await chatApi.getProfiles(token))}>Call</button>
        </Row>

        <Row label="getinvites" result={results.getinvites}>
          <button className={`${btn} bg-blue-500`} onClick={async () => set("getinvites", await chatApi.getInvites(token))}>Call</button>
        </Row>

        <Row label="getphoto" result={results.getphoto}>
          <input className={`${inp} w-24`} placeholder="photoid" value={photoid} onChange={(e) => setPhotoid(e.target.value)} />
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () => {
              const r = await chatApi.getPhoto(token, photoid);
              if (r.ok && typeof r.data === "string") setPhotoUrl(r.data);
              set("getphoto", r);
            }}
          >
            Call
          </button>
          {photoUrl && <img src={photoUrl} alt="fetched" className="h-16 border" />}
        </Row>

        <Row label="createchat" result={results.createchat}>
          <input className={`${inp}`} placeholder="chatname" value={chatname} onChange={(e) => setChatname(e.target.value)} />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={ispublic} onChange={(e) => setIspublic(e.target.checked)} />
            public
          </label>
          <button
            className={`${btn} bg-blue-500`}
            onClick={async () => set("createchat", await chatApi.createChat({ token, chatname, ispublic }))}
          >
            Call
          </button>
        </Row>

        <Row label="deletechat" result={results.deletechat}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <span className="text-xs text-red-500">deletes the chat!</span>
          <button className={`${btn} bg-red-500`} onClick={async () => set("deletechat", await chatApi.deleteChat(token, Number(chatid)))}>Call</button>
        </Row>

        <Row label="invite" result={results.invite}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <input className={`${inp} flex-1`} placeholder="invitedhash" value={invitedhash} onChange={(e) => setInvitedhash(e.target.value)} />
          <button className={`${btn} bg-blue-500`} onClick={async () => set("invite", await chatApi.inviteUser(token, Number(chatid), invitedhash))}>Call</button>
        </Row>

        <Row label="joinchat" result={results.joinchat}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <button className={`${btn} bg-blue-500`} onClick={async () => set("joinchat", await chatApi.joinChat(token, Number(chatid)))}>Call</button>
        </Row>

        <Row label="leavechat" result={results.leavechat}>
          <input className={`${inp} w-20`} placeholder="chatid" value={chatid} onChange={(e) => setChatid(e.target.value)} />
          <button className={`${btn} bg-blue-500`} onClick={async () => set("leavechat", await chatApi.leaveChat(token, Number(chatid)))}>Call</button>
        </Row>
      </section>
    </div>
  );
}
